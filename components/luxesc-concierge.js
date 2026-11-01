import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import '@servicenow/aiux/aiux-components-tabs';
import {GIVE_UP_MS, POLL_MS, callRuns} from '../utils/agent-runs.js';
import {addComment, updateRecord} from '../utils/api.js';
import {askAssistant} from './luxesc-ask.js';
import './luxesc-agent-steps.js';

const log = getLogger('luxesc-concierge');

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

// What the employee can do on a briefing item, right from the card. Each one
// is confirmed in the card first and runs as the employee through the Table API.
const ACTIONS = {
  approve: {
    commentRequired: false,
    run: (item, comment) => updateRecord('sysapproval_approver', item.approvalId, {state: 'approved', comments: comment}),
    done: () => i18n.getMessage('Approved.')
  },
  reject: {
    commentRequired: true,
    run: (item, comment) => updateRecord('sysapproval_approver', item.approvalId, {state: 'rejected', comments: comment}),
    done: () => i18n.getMessage('Rejected.')
  },
  comment: {
    commentRequired: true,
    run: (item, comment) => addComment('task', item.sysId, comment),
    done: () => i18n.getMessage('Comment posted. The people working on it will see it.')
  },
  // Accepting the resolution closes the incident
  close: {
    commentRequired: false,
    run: item => updateRecord('incident', item.sysId, {state: '7'}),
    done: () => i18n.getMessage('Closed. Thanks for confirming.')
  },
  // A caller's comment on a resolved incident reopens it (OOB)
  reopen: {
    commentRequired: true,
    run: (item, comment) => addComment('incident', item.sysId, comment),
    done: () => i18n.getMessage('Sent back to the service desk with your comment.')
  }
};

// The briefing's tabs, most urgent first; kinds the agent invents land in On track
const GROUPS = [
  {id: 'need', kinds: ['approval', 'action', 'done'], label: count => i18n.getMessage('Need you ({0})', count)},
  {id: 'stale', kinds: ['stale'], label: count => i18n.getMessage('No recent update ({0})', count)},
  {id: 'track', kinds: [], label: count => i18n.getMessage('On track ({0})', count)}
];
const groupOf = item => (GROUPS.find(group => group.kinds.includes(item.kind)) || GROUPS[2]).id;

// Shown on the row; the others (Still not fixed) wait in the item's details
const ROW_ACTIONS = ['approve', 'reject', 'close', 'comment'];

// Items shown on the home tile; the rest wait behind "See all"
const COMPACT_ITEMS = 4;

function actionLabel(action) {
  return {
    approve: i18n.getMessage('Approve'),
    reject: i18n.getMessage('Reject'),
    comment: i18n.getMessage('Post comment'),
    close: i18n.getMessage('Yes, it is fixed'),
    reopen: i18n.getMessage('Still not fixed')
  }[action];
}

function actionsFor(item) {
  if (item.kind === 'approval' && item.approvalId) return ['approve', 'reject'];
  if (!item.sysId) return [];
  if (item.kind === 'done' && item.number?.startsWith('INC')) return ['close', 'reopen'];
  if (item.kind === 'stale' || item.kind === 'action') return ['comment'];
  return [];
}

const itemKey = item => item.approvalId || item.sysId || item.title;

/**
 * The Employee Concierge: runs the custom AI agent that reviews the
 * employee's requests and approvals and shows the briefing as tabs (Need you,
 * No recent update, On track) of one-line items with their main action; the
 * detail, other actions and a question for the assistant open on demand.
 */
@customElement('luxesc-concierge')
export class Concierge extends AIUXElement {
  @property({type: String}) basePath = '';
  // Home tile: only the items that need the employee, with their actions
  @property({type: Boolean}) compact = false;

  @state() _run = null;
  // The last finished run, still shown while a refresh is running
  @state() _previous = null;
  // Tab the employee picked, and the item whose details are open
  @state() _tab = '';
  @state() _expanded = '';
  @state() _loading = true;
  @state() _error = '';
  // The action being confirmed: {key, action, comment, busy, error}
  @state() _pending = null;

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
      if (this._run?.briefing) this._previous = this._run;
      this._run = await callRuns('/runs', {method: 'POST'});
      this._pending = null;
      this._expanded = '';
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
      // During a refresh the item belongs to the previous briefing still on screen
      const field = this._run?.briefing ? '_run' : '_previous';
      const run = this[field];
      this[field] = {
        ...run,
        briefing: {
          ...run.briefing,
          items: run.briefing.items.map(entry => (itemKey(entry) === pending.key ? {...entry, outcome: pending.action} : entry))
        }
      };
      // The action is done; remembering it only stops the card offering it again
      callRuns(`/runs/${run.id}/outcomes`, {method: 'POST', body: {key: pending.key, action: pending.action}}).catch(error =>
        log.warn({error: error.message}, 'Outcome not recorded')
      );
    } catch (error) {
      log.error({error: error.message, action: pending.action}, 'Concierge action failed');
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
                    : i18n.getMessage('Your comment (review the draft)')}
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

  _renderRowActions(item) {
    if (ACTIONS[item.outcome]) {
      return html`<span class="aiux-badge aiux-badge-success aiux-badge-soft h-auto py-1 text-sm" role="status">
        ${ACTIONS[item.outcome].done()}
      </span>`;
    }
    if (this._pending?.key === itemKey(item)) return nothing;
    return actionsFor(item)
      .filter(action => ROW_ACTIONS.includes(action))
      .map(action => this._renderAction(item, action));
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

  _renderDetails(item, id) {
    const more = ACTIONS[item.outcome] || this._pending?.key === itemKey(item)
      ? []
      : actionsFor(item).filter(action => !ROW_ACTIONS.includes(action));
    return html`<div id=${id} class="flex flex-col items-start gap-2 ps-1">
      ${item.detail ? html`<p class="max-w-full break-words text-sm text-text-secondary">${item.detail}</p>` : nothing}
      ${more.length || item.sysId
        ? html`<div class="flex flex-wrap items-center gap-2">
            ${more.map(action => this._renderAction(item, action))}
            ${item.sysId
              ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => this._open(item)}>
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

  _renderRow(item, index) {
    const key = itemKey(item);
    const expanded = this._expanded === key;
    const detailsId = `concierge-item-${index}`;
    return html`<li class="flex flex-col gap-2 py-3">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="flex min-w-0 flex-1 basis-64 items-center gap-2">
          <span class="aiux-badge aiux-badge-sm aiux-badge-soft shrink-0 ${KIND_BADGE[item.kind] || 'aiux-badge-info'}">
            ${kindLabel(item.kind)}
          </span>
          ${item.number ? html`<span class="shrink-0 text-sm text-text-secondary">${item.number}</span>` : nothing}
          <span class="min-w-0 font-medium ${expanded ? 'break-words' : 'truncate'}" title=${item.title}>${item.title}</span>
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

  _renderResult(run) {
    if (run.state === 'failed') {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The concierge could not finish your briefing. Try again.')}
      </div>`;
    }
    const briefing = run.briefing;
    if (!briefing) return nothing;
    const items = briefing.items || [];
    const groups = GROUPS.map(group => ({...group, items: items.filter(item => groupOf(item) === group.id)})).filter(
      group => group.items.length
    );
    const active = groups.find(group => group.id === this._tab) || groups[0];
    return html`<p class="max-w-full break-words font-medium">${briefing.headline}</p>
      ${groups[0]?.id !== 'need' ? html`<p class="text-sm text-text-secondary">${i18n.getMessage('Nothing needs you right now.')}</p>` : nothing}
      ${active
        ? html`<aiux-tab-group
              variant="bordered"
              size="sm"
              tablist-label=${i18n.getMessage('Briefing groups')}
              .tabs=${groups.map(group => ({id: group.id, label: group.label(group.items.length)}))}
              .activeTab=${active.id}
              @aiux-tab-group:tab-change=${e => {
                this._tab = e.detail.id;
                this._expanded = '';
              }}
            ></aiux-tab-group>
            <ul class="flex flex-col divide-y divide-base-300" aria-label=${active.label(active.items.length)}>
              ${active.items.map((item, index) => this._renderRow(item, index))}
            </ul>`
        : nothing}`;
  }

  _renderProgress(run) {
    return html`<details class="text-sm">
      <summary class="cursor-pointer">
        ${this._previous ? i18n.getMessage('Refreshing your briefing…') : i18n.getMessage('Preparing your briefing…')}
      </summary>
      <luxesc-agent-steps .steps=${run.steps || []} running label=${i18n.getMessage('What the concierge is doing')}></luxesc-agent-steps>
    </details>`;
  }

  _renderCompactBody(run, shown) {
    const running = run?.state === 'running';
    if (!run) {
      return html`<button type="button" class="aiux-btn aiux-btn-primary aiux-btn-sm self-start" ?disabled=${this._loading} @click=${this._start}>
        ${i18n.getMessage('Brief me')}
      </button>`;
    }
    if (running && !this._previous) {
      return html`${this._renderProgress(run)}
        <div class="flex flex-col gap-2" aria-hidden="true">
          <div class="aiux-skeleton h-10 w-full"></div>
          <div class="aiux-skeleton h-10 w-full"></div>
        </div>`;
    }
    if (shown.state === 'failed' || !shown.briefing) {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The concierge could not finish your briefing. Try again.')}
      </div>`;
    }
    const items = (shown.briefing.items || []).filter(item => groupOf(item) === 'need');
    const others = (shown.briefing.items || []).length - items.length;
    return html`${running ? this._renderProgress(run) : nothing}
      ${items.length
        ? html`<ul class="flex flex-col divide-y divide-base-300">
            ${items.slice(0, COMPACT_ITEMS).map((item, index) => this._renderRow(item, index))}
          </ul>`
        : html`<p class="py-2 text-sm text-text-secondary">
            ${others
              ? i18n.getMessage('Nothing needs you right now. {0} other things are on track.', others)
              : i18n.getMessage('Nothing needs you right now.')}
          </p>`}
      ${items.length > COMPACT_ITEMS
        ? html`<a class="aiux-link aiux-link-primary self-start text-sm" href="${this.basePath}/requests">
            ${i18n.getMessage('See all ({0})', items.length)}
          </a>`
        : nothing}`;
  }

  _renderCompact() {
    const run = this._run;
    const running = run?.state === 'running';
    const shown = running && this._previous ? this._previous : run;
    const count = shown?.briefing ? (shown.briefing.items || []).filter(item => groupOf(item) === 'need').length : 0;
    return html`<section class="aiux-card h-full border border-base-300 bg-base-100 shadow-sm" aria-labelledby="concierge-title">
      <div class="aiux-card-body gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 flex-col">
            <h2 id="concierge-title" class="aiux-card-title text-lg">
              ${count ? i18n.getMessage('Needs you · {0}', count) : i18n.getMessage('Needs you')}
            </h2>
            ${shown?.startedOn && shown.state !== 'running'
              ? html`<p class="text-xs text-text-secondary">${i18n.getMessage('Checked by an AI agent at {0}', shown.startedOn)}</p>`
              : nothing}
          </div>
          ${run
            ? html`<button
                type="button"
                class="aiux-btn aiux-btn-sm aiux-btn-ghost aiux-btn-square"
                aria-label=${i18n.getMessage('Refresh my briefing')}
                title=${i18n.getMessage('Refresh my briefing')}
                ?disabled=${this._loading || running}
                @click=${this._start}
              >
                ${running || this._loading
                  ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
                  : icon({name: 'rotate-clockwise', size: 'sm'})}
              </button>`
            : nothing}
        </div>
        <div role="status" aria-live="polite" class="flex flex-col gap-2">
          ${this._error ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>` : nothing}
          ${this._renderCompactBody(run, shown)}
        </div>
      </div>
    </section>`;
  }

  render() {
    if (this.compact) return this._renderCompact();
    const run = this._run;
    const running = run?.state === 'running';
    // While refreshing, the previous briefing stays and the agent's steps fold away
    const shown = running && this._previous ? this._previous : run;
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="concierge-title">
      <div class="aiux-card-body gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <h2 id="concierge-title" class="aiux-card-title text-xl">${i18n.getMessage('Your concierge')}</h2>
            <p class="text-sm text-text-secondary">
              ${shown?.startedOn && shown.state !== 'running'
                ? i18n.getMessage('An AI agent reviewed your requests and approvals at {0}.', shown.startedOn)
                : i18n.getMessage('An AI agent reviews your requests and approvals and tells you what needs you.')}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <a class="aiux-link aiux-link-primary text-sm" href="${this.basePath}/requests">
              ${i18n.getMessage('View all requests')}
            </a>
            <button
              type="button"
              class="aiux-btn aiux-btn-sm ${run ? 'aiux-btn-outline' : 'aiux-btn-primary'}"
              ?disabled=${this._loading || running}
              @click=${this._start}
            >
              ${running || this._loading
                ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
                : nothing}
              ${run ? i18n.getMessage('Refresh my briefing') : i18n.getMessage('Brief me')}
            </button>
          </div>
        </div>
        <div role="status" aria-live="polite" class="flex flex-col gap-3">
          ${this._error
            ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>`
            : nothing}
          ${running
            ? html`<details class="text-sm">
                  <summary class="cursor-pointer">
                    ${this._previous ? i18n.getMessage('Refreshing your briefing…') : i18n.getMessage('Preparing your briefing…')}
                  </summary>
                  <luxesc-agent-steps
                    .steps=${run.steps || []}
                    running
                    label=${i18n.getMessage('What the concierge is doing')}
                  ></luxesc-agent-steps>
                </details>
                ${this._previous
                  ? nothing
                  : html`<div class="flex flex-col gap-2" aria-hidden="true">
                      <div class="aiux-skeleton h-5 w-3/4"></div>
                      <div class="aiux-skeleton h-10 w-full"></div>
                      <div class="aiux-skeleton h-10 w-full"></div>
                    </div>`}`
            : run && !run.briefing
              ? html`<luxesc-agent-steps
                  .steps=${run.steps || []}
                  label=${i18n.getMessage('What the concierge is doing')}
                ></luxesc-agent-steps>`
              : nothing}
          ${shown && shown.state !== 'running' ? this._renderResult(shown) : nothing}
        </div>
      </div>
    </section>`;
  }
}
