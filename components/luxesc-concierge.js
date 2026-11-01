import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
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
  // The action being confirmed: {key, action, comment, busy, error}
  @state() _pending = null;
  // Outcome message per item key, once an action ran
  @state() _outcomes = {};

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
      this._run = await callRuns('/runs', {method: 'POST'});
      this._pending = null;
      this._outcomes = {};
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
      this._outcomes = {...this._outcomes, [pending.key]: action.done()};
      this._pending = null;
    } catch (error) {
      log.error({error: error.message, action: pending.action}, 'Concierge action failed');
      this._pending = {...pending, busy: false, error: i18n.getMessage('That did not work: {0}', error.message)};
    }
  }

  _renderConfirm(item) {
    const pending = this._pending;
    const action = ACTIONS[pending.action];
    const needsText = action.commentRequired || pending.action === 'approve';
    return html`<div class="flex flex-col gap-2 rounded-box border border-base-300 p-3">
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

  _renderActions(item) {
    const key = itemKey(item);
    if (this._outcomes[key]) {
      return html`<p class="aiux-badge aiux-badge-success aiux-badge-soft h-auto py-1 text-sm" role="status">${this._outcomes[key]}</p>`;
    }
    if (this._pending?.key === key) return this._renderConfirm(item);
    const actions = actionsFor(item);
    return actions.length
      ? html`<div class="flex flex-wrap gap-2">
          ${actions.map(
            action => html`<button
              type="button"
              class="aiux-btn aiux-btn-sm ${action === 'reject' || action === 'reopen' ? 'aiux-btn-outline' : 'aiux-btn-secondary'}"
              @click=${() => this._choose(item, action)}
            >
              ${actionLabel(action)}
            </button>`
          )}
        </div>`
      : nothing;
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
        ${this._renderActions(item)}
        <div class="flex flex-wrap gap-2">
          ${item.sysId
            ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => this._open(item)}>
                ${i18n.getMessage('Open')}
              </button>`
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
      <ul class="flex flex-col gap-3">
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
          ${run && (running || !run.briefing)
            ? html`<luxesc-agent-steps
                .steps=${run.steps || []}
                ?running=${running}
                label=${i18n.getMessage('What the concierge is doing')}
              ></luxesc-agent-steps>`
            : nothing}
          ${run && !running ? this._renderResult(run) : nothing}
        </div>
      </div>
    </section>`;
  }
}
