import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {AIUXElement, aiuxFetch, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {askAssistant} from './luxesc-ask.js';

const log = getLogger('luxesc-concierge');

const API = '/api/x_everi_luxesc/v1/concierge/runs';
const POLL_MS = 2500;
// An agent run that is still going after this long is reported as stuck
const GIVE_UP_MS = 4 * 60 * 1000;

const KIND_BADGE = {
  approval: 'aiux-badge-warning',
  action: 'aiux-badge-error',
  stale: 'aiux-badge-warning',
  progress: 'aiux-badge-info',
  done: 'aiux-badge-success'
};

function kindLabel(kind) {
  return (
    {
      approval: i18n.getMessage('Needs your approval'),
      action: i18n.getMessage('Needs your action'),
      stale: i18n.getMessage('No recent update'),
      progress: i18n.getMessage('In progress'),
      done: i18n.getMessage('Ready to confirm')
    }[kind] || i18n.getMessage('For your information')
  );
}

async function call(url, method = 'GET') {
  const response = await aiuxFetch(url, {
    method,
    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    body: method === 'POST' ? '{}' : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message || `HTTP error ${response.status}`);
  return json.result?.run || null;
}

/**
 * The Employee Concierge: runs the custom AI agent that reviews the
 * employee's requests and approvals, shows its reasoning live, and turns the
 * briefing into one-click next steps (open the record, or hand it to the
 * assistant).
 */
@customElement('luxesc-concierge')
export class Concierge extends AIUXElement {
  @property({type: String}) basePath = '';

  @state() _run = null;
  @state() _loading = true;
  @state() _error = '';

  _timer = null;
  _startedAt = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) this._loadLatest();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  async _loadLatest() {
    try {
      const run = await call(`${API}/latest`);
      this._run = run?.id ? run : null;
      if (this._run?.state === 'running') this._poll();
    } catch (error) {
      log.warn({error: error.message}, 'Concierge unavailable');
      this._error = i18n.getMessage('The concierge is not available right now.');
    } finally {
      this._loading = false;
    }
  }

  async _start() {
    clearTimeout(this._timer);
    this._error = '';
    this._loading = true;
    try {
      this._run = await call(API, 'POST');
      this._startedAt = Date.now();
      if (this._run?.state === 'running') this._poll();
    } catch (error) {
      log.error({error: error.message}, 'Concierge did not start');
      this._error = i18n.getMessage('The concierge could not start. Try again in a moment.');
    } finally {
      this._loading = false;
    }
  }

  _poll() {
    this._startedAt ||= Date.now();
    this._timer = setTimeout(async () => {
      try {
        this._run = await call(`${API}/${this._run.id}`);
      } catch (error) {
        log.warn({error: error.message}, 'Concierge progress unavailable');
      }
      if (this._run?.state !== 'running') return;
      if (Date.now() - this._startedAt > GIVE_UP_MS) {
        this._error = i18n.getMessage('The concierge is taking longer than usual. Check back in a few minutes.');
        return;
      }
      this._poll();
    }, POLL_MS);
  }

  _open(item) {
    if (item.sysId) navigate(`/requests/${item.sysId}`);
  }

  _renderSteps(run) {
    const steps = (run.steps || []).filter(step => step.thought || step.actions?.length || step.type !== 'gen_ai');
    return html`<ol class="flex flex-col gap-2" aria-label=${i18n.getMessage('What the concierge is doing')}>
      ${steps.map(
        step => html`<li class="flex gap-2 text-sm">
          <span
            class=${classMap({
              'aiux-badge aiux-badge-sm aiux-badge-soft shrink-0': true,
              'aiux-badge-success': step.status === 'completed' || step.status === 'success',
              'aiux-badge-info': step.status !== 'completed' && step.status !== 'success'
            })}
          >
            ${step.actions?.length ? step.actions.join(', ') : step.name}
          </span>
          ${step.thought
            ? html`<span class="min-w-0 break-words text-text-secondary">${step.thought}</span>`
            : nothing}
        </li>`
      )}
      ${run.state === 'running'
        ? html`<li class="flex flex-col gap-2" aria-hidden="true">
            <div class="aiux-skeleton h-4 w-3/4"></div>
            <div class="aiux-skeleton h-4 w-1/2"></div>
          </li>`
        : nothing}
    </ol>`;
  }

  _renderItem(item) {
    return html`<li class="aiux-card border border-base-300 bg-base-100">
      <div class="aiux-card-body gap-2 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="aiux-badge aiux-badge-soft ${KIND_BADGE[item.kind] || 'aiux-badge-info'}">
            ${kindLabel(item.kind)}
          </span>
          ${item.number ? html`<span class="text-sm text-text-secondary">${item.number}</span>` : nothing}
        </div>
        <h3 class="max-w-full break-words font-semibold">${item.title}</h3>
        <p class="max-w-full break-words text-sm text-text-secondary">${item.detail}</p>
        <div class="flex flex-wrap gap-2">
          ${item.sysId
            ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => this._open(item)}>
                ${i18n.getMessage('Open')}
              </button>`
            : nothing}
          ${item.question
            ? html`<button
                type="button"
                class="aiux-btn aiux-btn-sm aiux-btn-primary h-auto min-h-8 max-w-full whitespace-normal py-1 text-start"
                @click=${() => askAssistant(this, item.question)}
              >
                ${item.question}
              </button>`
            : nothing}
        </div>
      </div>
    </li>`;
  }

  _renderResult(run) {
    if (run.state === 'failed') {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The concierge could not finish your briefing. Try again.')}
      </div>`;
    }
    const briefing = run.briefing;
    if (!briefing) return nothing;
    return html`<p class="max-w-full break-words text-lg font-medium">${briefing.headline}</p>
      <ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
        ${(briefing.items || []).map(item => this._renderItem(item))}
      </ul>`;
  }

  render() {
    const run = this._run;
    const running = run?.state === 'running';
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="concierge-title">
      <div class="aiux-card-body gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <h2 id="concierge-title" class="aiux-card-title text-xl">${i18n.getMessage('Your concierge')}</h2>
            <p class="text-sm text-text-secondary">
              ${run?.startedOn && !running
                ? i18n.getMessage('An AI agent reviewed your requests and approvals at {0}.', run.startedOn)
                : i18n.getMessage('An AI agent reviews your requests and approvals and tells you what needs you.')}
            </p>
          </div>
          <button
            type="button"
            class="aiux-btn aiux-btn-primary"
            ?disabled=${this._loading || running}
            @click=${this._start}
          >
            ${running || this._loading
              ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
              : nothing}
            ${run ? i18n.getMessage('Refresh my briefing') : i18n.getMessage('Brief me')}
          </button>
        </div>
        <div role="status" aria-live="polite" class="flex flex-col gap-4">
          ${this._error
            ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>`
            : nothing}
          ${run && (running || !run.briefing) ? this._renderSteps(run) : nothing}
          ${run && !running ? this._renderResult(run) : nothing}
        </div>
      </div>
    </section>`;
  }
}
