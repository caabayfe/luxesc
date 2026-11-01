import {html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import {ACTIONS, KIND_TONE, ROW_ACTIONS, actionLabel, actionsFor, itemKey, kindLabel, needsYou} from '../utils/record-actions.js';
import {askAssistant} from './luxesc-ask.js';
import './luxesc-journey.js';

const log = getLogger('luxesc-record-list');

/**
 * The employee's requests, incidents and approvals as one-line rows: the title,
 * where it is in plain words ("Being prepared · 2 days late", "Ready to
 * confirm") and its main action (Approve, Yes it is fixed, Post comment),
 * confirmed in the row before it runs. Opening a row shows the record's journey,
 * the explanation when there is one, the other actions and a question for the
 * assistant.
 *
 * Items: {kind, sysId, approvalId, number, title, status, attention, detail,
 * draft, question, outcome}. Fires luxesc-record-list:done {key, action} after
 * an action succeeds.
 */
@customElement('luxesc-record-list')
export class RecordList extends AIUXElement {
  @property({type: Array}) items = [];
  @property({type: String}) label = '';

  // The item whose details are open
  @state() _expanded = '';
  // The action being confirmed: {key, action, comment, busy, error}
  @state() _pending = null;
  // Actions done here, by item key, on top of the outcomes the items carry
  @state() _outcomes = {};

  static styles = css`
    :host {
      display: block;
    }
  `;

  willUpdate(changed) {
    // A new list (another tab, a refreshed briefing) starts closed
    if (changed.has('items') && changed.get('items') !== undefined) {
      this._expanded = '';
      this._pending = null;
    }
  }

  _outcome(item) {
    return this._outcomes[itemKey(item)] || item.outcome;
  }

  _choose(item, action) {
    // Drafts are only offered for comments; a rejection needs the employee's own reason
    const comment = action === 'comment' ? item.draft || '' : '';
    this._pending = {key: itemKey(item), action, comment, busy: false, error: ''};
  }

  async _confirm(item) {
    const pending = this._pending;
    const action = ACTIONS[pending.action];
    const comment = pending.comment.trim();
    if (action.commentRequired && !comment) return;
    this._pending = {...pending, busy: true, error: ''};
    try {
      await action.run(item, comment);
      this._pending = null;
      this._outcomes = {...this._outcomes, [pending.key]: pending.action};
      this.renderRoot.querySelector(`luxesc-journey[task-id="${item.sysId}"]`)?.refresh();
      this.dispatchEvent(
        new CustomEvent('luxesc-record-list:done', {detail: {key: pending.key, action: pending.action}, bubbles: true, composed: true})
      );
    } catch (error) {
      log.error({error: error.message, action: pending.action}, 'Record action failed');
      this._pending = {...pending, busy: false, error: i18n.getMessage('That did not work: {0}', error.message)};
    }
  }

  _renderConfirm(item) {
    const pending = this._pending;
    const action = ACTIONS[pending.action];
    const needsText = action.commentRequired || pending.action === 'approve';
    return html`<div class="flex w-full flex-col gap-2 rounded-box border border-base-300 p-3">
      ${needsText
        ? html`<label class="aiux-fieldset">
            <span class="aiux-fieldset-legend text-sm">
              ${pending.action === 'reject'
                ? i18n.getMessage('Why are you rejecting it?')
                : pending.action === 'approve'
                  ? i18n.getMessage('Comment (optional)')
                  : pending.action === 'reopen'
                    ? i18n.getMessage('What is still wrong?')
                    : item.draft
                      ? i18n.getMessage('Your comment (review the draft)')
                      : i18n.getMessage('Your comment')}
            </span>
            <textarea
              class="aiux-textarea w-full"
              rows="3"
              .value=${pending.comment}
              @input=${e => (this._pending = {...this._pending, comment: e.target.value})}
            ></textarea>
          </label>`
        : html`<p class="text-sm">${i18n.getMessage('Close {0}? You can still raise a new incident if it comes back.', item.number)}</p>`}
      ${pending.error ? html`<p class="text-sm text-error" role="alert">${pending.error}</p>` : nothing}
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${() => (this._pending = null)}>
          ${i18n.getMessage('Cancel')}
        </button>
        <button
          type="button"
          class="aiux-btn aiux-btn-sm ${pending.action === 'reject' ? 'aiux-btn-error' : 'aiux-btn-primary'}"
          ?disabled=${pending.busy || (action.commentRequired && !pending.comment.trim())}
          @click=${() => this._confirm(item)}
        >
          ${pending.busy ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
          ${i18n.getMessage('Confirm: {0}', actionLabel(pending.action))}
        </button>
      </div>
    </div>`;
  }

  _renderAction(item, action) {
    return html`<button
      type="button"
      class="aiux-btn aiux-btn-sm ${action === 'reject' || action === 'reopen' ? 'aiux-btn-outline' : 'aiux-btn-secondary'}"
      @click=${() => this._choose(item, action)}
    >
      ${actionLabel(action)}
    </button>`;
  }

  _renderRowActions(item) {
    const outcome = this._outcome(item);
    if (ACTIONS[outcome]) {
      return html`<span class="aiux-badge aiux-badge-success aiux-badge-soft h-auto py-1 text-sm" role="status">
        ${ACTIONS[outcome].done()}
      </span>`;
    }
    if (this._pending?.key === itemKey(item)) return nothing;
    return actionsFor(item)
      .filter(action => ROW_ACTIONS.includes(action))
      .map(action => this._renderAction(item, action));
  }

  _renderDetails(item, id) {
    const more = ACTIONS[this._outcome(item)] || this._pending?.key === itemKey(item)
      ? []
      : actionsFor(item).filter(action => !ROW_ACTIONS.includes(action));
    return html`<div id=${id} class="flex flex-col items-start gap-3 ps-1">
      ${item.sysId ? html`<luxesc-journey task-id=${item.sysId} label=${item.title}></luxesc-journey>` : nothing}
      ${item.detail ? html`<p class="max-w-full break-words text-sm text-text-secondary">${item.detail}</p>` : nothing}
      ${more.length || item.sysId
        ? html`<div class="flex flex-wrap items-center gap-2">
            ${more.map(action => this._renderAction(item, action))}
            ${item.sysId
              ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => navigate(`/requests/${item.sysId}`)}>
                  ${i18n.getMessage('Open')}
                </button>`
              : nothing}
          </div>`
        : nothing}
      ${item.question
        ? html`<button
            type="button"
            class="aiux-btn aiux-btn-sm aiux-btn-ghost h-auto min-h-8 max-w-full whitespace-normal py-1 text-start"
            @click=${() => askAssistant(this, item.question)}
          >
            ${item.question}
          </button>`
        : nothing}
    </div>`;
  }

  // Where the record is, in plain words: what the employee must do, or where it is in its journey
  _renderStatus(item) {
    const need = needsYou(item);
    const text = need ? kindLabel(item.kind) : item.status || kindLabel(item.kind);
    const tone = need ? KIND_TONE[item.kind] : item.attention || item.kind === 'stale' ? 'bg-warning' : 'bg-info';
    return html`<span class="flex min-w-0 items-center gap-2 text-sm">
      <span class="size-2 shrink-0 rounded-full ${tone}" aria-hidden="true"></span>
      <span class="truncate ${need || item.attention ? 'font-medium' : 'text-text-secondary'}">${text}</span>
      ${item.number ? html`<span class="shrink-0 text-text-secondary">· ${item.number}</span>` : nothing}
    </span>`;
  }

  _renderRow(item, index) {
    const key = itemKey(item);
    const expanded = this._expanded === key;
    const detailsId = `record-${index}`;
    return html`<li class="flex flex-col gap-3 py-3">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
          <span class="min-w-0 font-medium ${expanded ? 'break-words' : 'truncate'}" title=${item.title}>${item.title}</span>
          ${this._renderStatus(item)}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          ${this._renderRowActions(item)}
          <button
            type="button"
            class="aiux-btn aiux-btn-sm aiux-btn-ghost aiux-btn-square"
            aria-expanded=${expanded ? 'true' : 'false'}
            aria-controls=${detailsId}
            aria-label=${expanded ? i18n.getMessage('Hide details') : i18n.getMessage('Show details')}
            title=${expanded ? i18n.getMessage('Hide details') : i18n.getMessage('Show details')}
            @click=${() => (this._expanded = expanded ? '' : key)}
          >
            ${icon({name: expanded ? 'chevron-up-outline' : 'chevron-down-outline', size: 'sm'})}
          </button>
        </div>
      </div>
      ${this._pending?.key === key ? this._renderConfirm(item) : nothing}
      ${expanded ? this._renderDetails(item, detailsId) : nothing}
    </li>`;
  }

  render() {
    return html`<ul class="flex flex-col divide-y divide-base-300" aria-label=${this.label}>
      ${this.items.map((item, index) => this._renderRow(item, index))}
    </ul>`;
  }
}
