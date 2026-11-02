import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {clearPrefetchCache, clearRouteDataCache, navigate} from '@servicenow/aiux/aiux-client';
import {GIVE_UP_MS, POLL_MS, callRuns} from '../utils/agent-runs.js';
import {addToCart, fetchCart, removeCartItem, submitCart} from '../utils/api.js';
import {stashPrefill} from '../utils/ai-handoff.js';
import './luxesc-agent-steps.js';

const log = getLogger('luxesc-planner');
const MAX_QUANTITY = 20;

const ready = step => !step.missing.length;

/**
 * Plan a bigger request: the Request Planner agent turns one description
 * ("onboard 2 developers next Monday") into catalog items with their answers
 * filled in. The employee adjusts the checklist, adds it to the cart in one go
 * and submits one order. Items that still need answers open in their form.
 */
@customElement('luxesc-planner')
export class Planner extends AIUXElement {
  // Inside the home command box: no card or form of its own, the box holds the text
  @property({type: Boolean}) embedded = false;

  @state() _text = '';
  @state() _run = null;
  @state() _error = '';
  @state() _starting = false;
  // Per step index: {include, quantity, status: 'idle'|'adding'|'added'|'failed', message}
  @state() _steps = [];
  @state() _adding = false;
  @state() _cart = null;
  @state() _confirming = false;
  @state() _submitting = false;
  @state() _order = null;

  _timer = null;
  _startedAt = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  /** Starts planning; also called by the page's assistant tool. */
  async plan(text) {
    text = String(text || '').trim();
    if (!text || isServer) return null;
    clearTimeout(this._timer);
    Object.assign(this, {_text: text, _error: '', _starting: true, _steps: [], _cart: null, _order: null, _confirming: false});
    try {
      this._run = await callRuns('/plans', {method: 'POST', body: {text}});
      this._startedAt = Date.now();
      if (this._run?.state === 'running') this._poll();
      return this._run;
    } catch (error) {
      log.error({error: error.message}, 'Planner did not start');
      this._error = i18n.getMessage('The planner could not start. Try again in a moment.');
      return null;
    } finally {
      this._starting = false;
    }
  }

  _onSubmit(e) {
    e.preventDefault();
    this.plan(this._text);
  }

  _poll() {
    this._timer = setTimeout(async () => {
      try {
        this._run = await callRuns(`/runs/${this._run.id}`);
      } catch (error) {
        log.warn({error: error.message}, 'Planner progress unavailable');
      }
      if (this._run?.state !== 'running') return this._onFinished();
      if (Date.now() - this._startedAt > GIVE_UP_MS) {
        this._error = i18n.getMessage('Planning is taking longer than usual. Try again in a few minutes.');
        return;
      }
      this._poll();
    }, POLL_MS);
  }

  _onFinished() {
    const steps = this._run?.briefing?.steps || [];
    this._steps = steps.map(step => ({include: ready(step), quantity: step.quantity, status: 'idle', message: ''}));
    // Items already in the cart are ordered together with the plan, so show them now
    if (steps.length) this._loadCart();
  }

  _reset() {
    clearTimeout(this._timer);
    Object.assign(this, {_run: null, _text: '', _error: '', _steps: [], _cart: null, _order: null, _confirming: false});
  }

  _updateStep(index, change) {
    this._steps = this._steps.map((step, i) => (i === index ? {...step, ...change} : step));
  }

  // Answers it has go to the form as text, which the form matches to its controls
  _openForm(step, index) {
    stashPrefill(step.itemSysId, {
      quantity: this._steps[index].quantity,
      values: Object.fromEntries(step.display.map(answer => [answer.name, answer.value]))
    });
    navigate(`/catalog/${step.itemSysId}`);
  }

  async _addToCart() {
    const plan = this._run.briefing;
    this._adding = true;
    this._error = '';
    // One at a time, so each item reports its own result
    for (const [index, step] of plan.steps.entries()) {
      const local = this._steps[index];
      if (!local.include || local.status === 'added' || !ready(step)) continue;
      this._updateStep(index, {status: 'adding', message: ''});
      try {
        await addToCart(step.itemSysId, {quantity: local.quantity, variables: step.values});
        this._updateStep(index, {status: 'added'});
      } catch (error) {
        log.error({error: error.message, item: step.itemSysId}, 'Not added to cart');
        this._updateStep(index, {status: 'failed', message: error.message});
      }
    }
    this._adding = false;
    await this._loadCart();
  }

  async _loadCart() {
    try {
      this._cart = await fetchCart();
    } catch (error) {
      log.error({error: error.message}, 'Cart unavailable');
      this._error = i18n.getMessage('Your cart could not be loaded.');
    }
  }

  async _remove(cartItemId) {
    try {
      await removeCartItem(cartItemId);
    } catch (error) {
      log.error({error: error.message}, 'Cart item not removed');
    }
    await this._loadCart();
  }

  async _submit() {
    this._submitting = true;
    this._error = '';
    try {
      this._order = await submitCart();
      clearPrefetchCache();
      clearRouteDataCache();
      this._cart = null;
    } catch (error) {
      log.error({error: error.message}, 'Order not submitted');
      this._error = i18n.getMessage('Your order could not be submitted: {0}', error.message);
    } finally {
      this._submitting = false;
      this._confirming = false;
    }
  }

  _renderForm() {
    return html`<form class="flex flex-col gap-2" aria-label=${i18n.getMessage('Describe everything you need')} @submit=${this._onSubmit}>
      <label class="aiux-fieldset w-full">
        <span class="sr-only">${i18n.getMessage('Describe everything you need')}</span>
        <textarea
          class="aiux-textarea w-full"
          rows="3"
          .value=${this._text}
          placeholder=${i18n.getMessage('For example: onboard 2 new developers starting next Monday, each with a Windows laptop, Office and Adobe Acrobat')}
          @input=${e => (this._text = e.target.value)}
        ></textarea>
      </label>
      <button type="submit" class="aiux-btn aiux-btn-primary self-end" ?disabled=${!this._text.trim() || this._starting}>
        ${this._starting ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
        ${i18n.getMessage('Plan it')}
      </button>
    </form>`;
  }

  _renderStatus(local) {
    if (local.status === 'adding') return html`<span class="aiux-badge aiux-badge-info aiux-badge-soft">${i18n.getMessage('Adding...')}</span>`;
    if (local.status === 'added') return html`<span class="aiux-badge aiux-badge-success aiux-badge-soft">${i18n.getMessage('In your cart')}</span>`;
    if (local.status === 'failed') return html`<span class="aiux-badge aiux-badge-error aiux-badge-soft">${i18n.getMessage('Not added: {0}', local.message)}</span>`;
    return nothing;
  }

  _renderStep(step, index) {
    const local = this._steps[index];
    const id = `plan-step-${index}`;
    const locked = local.status === 'added' || local.status === 'adding';
    return html`<li class="aiux-card border border-base-300 bg-base-100">
      <div class="aiux-card-body gap-2 p-4">
        <div class="flex flex-wrap items-center gap-3">
          ${ready(step)
            ? html`<input
                id=${id}
                type="checkbox"
                class="aiux-checkbox aiux-checkbox-primary"
                .checked=${local.include}
                ?disabled=${locked}
                @change=${e => this._updateStep(index, {include: e.target.checked})}
              />`
            : nothing}
          <label for=${id} class="min-w-0 flex-1 break-words font-semibold">${step.itemName}</label>
          ${step.allowsQuantity
            ? html`<label class="flex items-center gap-2 text-sm">
                <span>${i18n.getMessage('Qty')}</span>
                <input
                  type="number"
                  class="aiux-input aiux-input-sm w-20"
                  min="1"
                  max=${MAX_QUANTITY}
                  .value=${String(local.quantity)}
                  ?disabled=${locked}
                  @change=${e => this._updateStep(index, {quantity: Math.min(MAX_QUANTITY, Math.max(1, Number(e.target.value) || 1))})}
                />
              </label>`
            : nothing}
          ${this._renderStatus(local)}
        </div>
        ${step.why ? html`<p class="break-words text-sm text-text-secondary">${step.why}</p>` : nothing}
        ${step.display.length
          ? html`<dl class="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              ${step.display.map(
                answer => html`<dt class="text-text-secondary">${answer.label}</dt>
                  <dd class="break-words">${answer.value}</dd>`
              )}
            </dl>`
          : nothing}
        ${step.missing.length || step.unresolved.length
          ? html`<div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="aiux-badge aiux-badge-warning aiux-badge-soft h-auto py-1">
                ${step.missing.length
                  ? i18n.getMessage('Still needs: {0}', step.missing.join(', '))
                  : i18n.getMessage('Check: {0}', step.unresolved.map(problem => problem.field).join(', '))}
              </span>
              <button type="button" class="aiux-btn aiux-btn-xs aiux-btn-outline" @click=${() => this._openForm(step, index)}>
                ${i18n.getMessage('Finish in the form')}
              </button>
            </div>`
          : nothing}
      </div>
    </li>`;
  }

  _renderCart() {
    if (this._order) {
      return html`<div class="aiux-alert aiux-alert-success aiux-alert-soft text-sm" role="status">
        <span>${i18n.getMessage('Order {0} submitted. You can follow each item in My stuff.', this._order.request_number)}</span>
        <button type="button" class="aiux-btn aiux-btn-sm" @click=${() => navigate('/requests')}>${i18n.getMessage('My stuff')}</button>
      </div>`;
    }
    const cart = this._cart;
    if (!cart) return nothing;
    // Items are grouped by billing frequency ("none" for one-off prices)
    const items = Object.values(cart).flatMap(group => group?.items || []);
    if (!items.length && !this._steps.some(step => step.status === 'added')) return nothing;
    return html`<section class="flex flex-col gap-3 rounded-box border border-base-300 p-4" aria-labelledby="plan-cart">
      <h3 id="plan-cart" class="font-semibold">${i18n.getMessage('Your cart')}</h3>
      ${items.length
        ? html`<ul class="flex flex-col divide-y divide-base-300 text-sm">
            ${items.map(
              item => html`<li class="flex flex-wrap items-center justify-between gap-2 py-2">
                <span class="min-w-0 break-words">${item.quantity} × ${item.item_name}</span>
                <span class="flex items-center gap-2">
                  ${item.subtotal_price ? html`<span class="text-text-secondary">${item.subtotal_price}</span>` : nothing}
                  <button type="button" class="aiux-btn aiux-btn-xs aiux-btn-ghost" @click=${() => this._remove(item.cart_item_id)}>
                    ${i18n.getMessage('Remove')}
                  </button>
                </span>
              </li>`
            )}
          </ul>
          ${cart.subtotal_price ? html`<p class="text-sm font-medium">${i18n.getMessage('Subtotal: {0}', cart.subtotal_price)}</p>` : nothing}
          ${this._confirming
            ? html`<div class="flex flex-wrap items-center justify-end gap-2">
                <span class="text-sm">${i18n.getMessage('Submit {0} items as one order?', items.length)}</span>
                <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${() => (this._confirming = false)}>
                  ${i18n.getMessage('Cancel')}
                </button>
                <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-primary" ?disabled=${this._submitting} @click=${this._submit}>
                  ${this._submitting ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
                  ${i18n.getMessage('Confirm: submit order')}
                </button>
              </div>`
            : html`<button type="button" class="aiux-btn aiux-btn-primary self-end" @click=${() => (this._confirming = true)}>
                ${i18n.getMessage('Submit order')}
              </button>`}`
        : html`<p class="text-sm text-text-secondary">${i18n.getMessage('Your cart is empty.')}</p>`}
    </section>`;
  }

  _renderPlan(run) {
    const plan = run.briefing;
    if (run.state === 'failed' || !plan) {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The planner could not finish. Try again, or describe what you need differently.')}
      </div>`;
    }
    const selected = plan.steps.filter((step, index) => this._steps[index]?.include && this._steps[index].status !== 'added' && ready(step));
    return html`<p class="max-w-full break-words font-medium">${plan.summary}</p>
      <ol class="flex flex-col gap-3" aria-label=${i18n.getMessage('Planned items')}>
        ${plan.steps.map((step, index) => this._renderStep(step, index))}
      </ol>
      ${plan.notes?.length
        ? html`<ul class="flex flex-col gap-1 text-sm text-text-secondary" aria-label=${i18n.getMessage('Notes from the planner')}>
            ${plan.notes.map(note => html`<li class="break-words">${note}</li>`)}
          </ul>`
        : nothing}
      ${this._order
        ? nothing
        : html`<div class="flex flex-wrap justify-end gap-2">
            <button type="button" class="aiux-btn aiux-btn-secondary" ?disabled=${this._adding || !selected.length} @click=${this._addToCart}>
              ${this._adding ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
              ${i18n.getMessage('Add {0} to cart', selected.length)}
            </button>
          </div>`}
      ${this._renderCart()}`;
  }

  render() {
    const run = this._run;
    const running = run?.state === 'running';
    const status = html`<div role="status" aria-live="polite" class="flex flex-col gap-4">
      ${this._error ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>` : nothing}
      ${run && (running || !run.briefing)
        ? html`<luxesc-agent-steps .steps=${run.steps || []} ?running=${running} label=${i18n.getMessage('What the planner is doing')}></luxesc-agent-steps>`
        : nothing}
      ${run && !running ? this._renderPlan(run) : nothing}
    </div>`;
    if (this.embedded) return status;
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="planner-title">
      <div class="aiux-card-body gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <h2 id="planner-title" class="aiux-card-title text-xl">${i18n.getMessage('Plan a bigger request')}</h2>
            <p class="break-words text-sm text-text-secondary">
              ${run
                ? i18n.getMessage('You asked for: {0}', run.prompt)
                : i18n.getMessage('Describe everything you need in one go. An AI agent picks the catalog items, fills in what it can, and you review one cart.')}
            </p>
          </div>
          ${run && !running
            ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._reset}>${i18n.getMessage('Start over')}</button>`
            : nothing}
        </div>
        ${status}
        ${run ? nothing : this._renderForm()}
      </div>
    </section>`;
  }
}
