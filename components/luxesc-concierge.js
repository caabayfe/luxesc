import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import '@servicenow/aiux/aiux-components-tabs';
import {GIVE_UP_MS, POLL_MS, callRuns} from '../utils/agent-runs.js';
import {itemKey, needsYou} from '../utils/record-actions.js';
import './luxesc-agent-steps.js';
import './luxesc-record-list.js';

const log = getLogger('luxesc-concierge');

// The briefing's two tabs: what waits on the employee, and everything else that is moving
const GROUPS = [
  {id: 'need', label: count => i18n.getMessage('Needs you ({0})', count)},
  {id: 'progress', label: count => i18n.getMessage('In progress ({0})', count)}
];
const groupOf = item => (needsYou(item) ? 'need' : 'progress');
// A briefing older than this is prepared again when the page opens
const STALE_MINUTES = 60;

/**
 * The Employee Concierge: runs the custom AI agent that reviews the
 * employee's requests and approvals and shows the briefing as two tabs (Needs
 * you, In progress). Each row says in plain words where the record is ("Being
 * prepared · 2 days late") with its main action; opening it shows the record's
 * journey (the milestones it actually went through, where it is now and what
 * comes next), the latest update, the agent's explanation and other actions.
 *
 * The briefing prepares itself: opening the page shows today's briefing and
 * starts a new one when there is none, the last one failed or it is older than
 * an hour (the old one stays on screen meanwhile). The refresh button runs it
 * again on demand.
 */
@customElement('luxesc-concierge')
export class Concierge extends AIUXElement {
  @property({type: String}) basePath = '';

  @state() _run = null;
  // The last finished run, still shown while a refresh is running
  @state() _previous = null;
  // Tab the employee picked
  @state() _tab = '';
  @state() _loading = true;
  @state() _error = '';
  // A run started on this page has just finished (announced to screen readers)
  @state() _finished = false;

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
      const run = await callRuns('/runs/latest');
      this._run = run?.id ? run : null;
    } catch (error) {
      log.warn({error: error.message}, 'Concierge unavailable');
      this._error = i18n.getMessage('The concierge is not available right now.');
      this._loading = false;
      return;
    }
    if (this._run?.state === 'running') {
      this._loading = false;
      this._poll();
    } else if (this._isStale(this._run)) {
      this._start();
    } else {
      this._loading = false;
    }
  }

  // No briefing today, a failed one or one older than STALE_MINUTES
  _isStale(run) {
    return !run || run.state === 'failed' || !run.briefing || (run.ageMinutes ?? 0) >= STALE_MINUTES;
  }

  async _start() {
    clearTimeout(this._timer);
    this._error = '';
    this._loading = true;
    try {
      if (this._run?.briefing) this._previous = this._run;
      this._finished = false;
      this._run = await callRuns('/runs', {method: 'POST'});
      this._tab = '';
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
        this._run = await callRuns(`/runs/${this._run.id}`);
      } catch (error) {
        log.warn({error: error.message}, 'Concierge progress unavailable');
      }
      if (this._run?.state !== 'running') {
        this._finished = true;
        return;
      }
      if (Date.now() - this._startedAt > GIVE_UP_MS) {
        this._error = i18n.getMessage('The concierge is taking longer than usual. Check back in a few minutes.');
        return;
      }
      this._poll();
    }, POLL_MS);
  }

  // An action done from a row: the briefing remembers it, so the row stops offering it
  _onDone(e) {
    const {key, action} = e.detail;
    // During a refresh the item belongs to the previous briefing still on screen
    const field = this._run?.briefing ? '_run' : '_previous';
    const run = this[field];
    if (!run?.briefing) return;
    this[field] = {
      ...run,
      briefing: {...run.briefing, items: run.briefing.items.map(entry => (itemKey(entry) === key ? {...entry, outcome: action} : entry))}
    };
    callRuns(`/runs/${run.id}/outcomes`, {method: 'POST', body: {key, action}}).catch(error =>
      log.warn({error: error.message}, 'Outcome not recorded')
    );
  }

  _renderResult(run) {
    if (run.state === 'failed' || !run.briefing) {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The concierge could not finish your briefing. Try again.')}
      </div>`;
    }
    const briefing = run.briefing;
    const items = briefing.items || [];
    const groups = GROUPS.map(group => ({...group, items: items.filter(item => groupOf(item) === group.id)}));
    // Both tabs always show, so the tile keeps its shape; it opens on the one that has something
    const active = groups.find(group => group.id === this._tab) || groups.find(group => group.items.length) || groups[0];
    return html`<p class="max-w-full break-words text-sm">${briefing.headline}</p>
      <aiux-tab-group
        variant="bordered"
        size="sm"
        tablist-label=${i18n.getMessage('Briefing groups')}
        .tabs=${groups.map(group => ({id: group.id, label: group.label(group.items.length)}))}
        .activeTab=${active.id}
        @aiux-tab-group:tab-change=${e => (this._tab = e.detail.id)}
      ></aiux-tab-group>
      ${active.items.length
        ? html`<luxesc-record-list
            .items=${active.items}
            label=${active.label(active.items.length)}
            @luxesc-record-list:done=${this._onDone}
          ></luxesc-record-list>`
        : html`<p class="py-2 text-sm text-text-secondary">
            ${active.id === 'need' ? i18n.getMessage('Nothing needs you right now.') : i18n.getMessage('Nothing else is in progress.')}
          </p>`}`;
  }

  _renderProgress(run) {
    return html`<details class="text-sm">
      <summary class="cursor-pointer">
        ${this._previous ? i18n.getMessage('Refreshing your briefing…') : i18n.getMessage('Preparing your briefing…')}
      </summary>
      <luxesc-agent-steps .steps=${run.steps || []} running label=${i18n.getMessage('What the concierge is doing')}></luxesc-agent-steps>
    </details>`;
  }

  // Only the briefing's progress is announced, not every row opened or tab switched
  _announcement(running) {
    if (this._error) return this._error;
    if (running) return this._previous ? i18n.getMessage('Refreshing your briefing…') : i18n.getMessage('Preparing your briefing…');
    return this._finished ? i18n.getMessage('Your briefing is ready.') : '';
  }

  _renderBody(run, shown) {
    // The briefing starts by itself; until the run exists there is only its placeholder
    const placeholder = html`<div class="flex flex-col gap-2" aria-hidden="true">
      <div class="aiux-skeleton h-8 w-1/2"></div>
      <div class="aiux-skeleton h-12 w-full"></div>
      <div class="aiux-skeleton h-12 w-full"></div>
    </div>`;
    if (!run) return this._error ? nothing : placeholder;
    if (run.state === 'running' && !this._previous) {
      return html`${this._renderProgress(run)} ${placeholder}`;
    }
    return html`${run.state === 'running' ? this._renderProgress(run) : nothing} ${this._renderResult(shown)}`;
  }

  render() {
    const run = this._run;
    const running = run?.state === 'running';
    // While refreshing, the previous briefing stays and the agent's steps fold away
    const shown = running && this._previous ? this._previous : run;
    return html`<section class="aiux-card h-full border border-base-300 bg-base-100 shadow-sm" aria-labelledby="concierge-title">
      <div class="aiux-card-body gap-3 max-sm:p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="flex min-w-0 flex-1 basis-48 flex-col">
            <h2 id="concierge-title" class="aiux-card-title text-lg">${i18n.getMessage('Your requests and approvals')}</h2>
            ${shown?.startedOn && shown.state !== 'running'
              ? html`<p class="text-xs text-text-secondary">${i18n.getMessage('Checked by an AI agent at {0}', shown.startedOn)}</p>`
              : nothing}
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <a class="aiux-link aiux-link-primary text-sm" href="${this.basePath}/requests">${i18n.getMessage('View all')}</a>
            <button
              type="button"
              class="aiux-btn aiux-btn-sm aiux-btn-ghost"
              title=${i18n.getMessage('Refresh my briefing')}
              ?disabled=${this._loading || running}
              @click=${this._start}
            >
              ${running || this._loading
                ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs" aria-hidden="true"></span>`
                : icon({name: 'rotate-clockwise', size: 'sm'})}
              ${i18n.getMessage('Refresh')}
            </button>
          </div>
        </div>
        <p class="sr-only" role="status">${this._announcement(running)}</p>
        <div class="flex flex-col gap-3">
          ${this._error ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>` : nothing}
          ${this._renderBody(run, shown)}
        </div>
      </div>
    </section>`;
  }
}
