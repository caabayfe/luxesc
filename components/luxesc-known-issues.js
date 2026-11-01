import {html, css, nothing, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import {callConcierge} from '../utils/agent-runs.js';

const log = getLogger('luxesc-known-issues');

/**
 * Known issues right now: active major incidents and outages (LuxEscOutages).
 * An affected employee joins the issue with one confirmed click, which raises
 * their incident under the major incident instead of a duplicate ticket.
 * Renders nothing when there are no known issues.
 */
@customElement('luxesc-known-issues')
export class KnownIssues extends AIUXElement {
  @state() _issues = [];
  // sysId of the issue awaiting confirmation, and of the one being joined
  @state() _confirming = '';
  @state() _joining = '';
  @state() _error = '';

  static styles = css`
    :host {
      display: block;
    }
    :host([hidden]) {
      display: none;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) this._load();
  }

  // Hidden while empty so the page layout keeps no gap for it
  willUpdate() {
    this.hidden = !this._issues.length;
  }

  async _load() {
    try {
      this._issues = (await callConcierge('/known-issues'))?.issues || [];
    } catch (error) {
      log.warn({error: error.message}, 'Known issues unavailable');
    }
  }

  async _join(issue) {
    this._joining = issue.sysId;
    this._error = '';
    try {
      const {incident} = await callConcierge(`/known-issues/${issue.sysId}/follow`, {method: 'POST', body: {}});
      this._issues = this._issues.map(item => (item.sysId === issue.sysId ? {...item, following: incident} : item));
    } catch (error) {
      log.error({error: error.message}, 'Known issue not joined');
      this._error = i18n.getMessage('You could not be added to this issue: {0}', error.message);
    } finally {
      this._joining = '';
      this._confirming = '';
    }
  }

  _renderActions(issue) {
    if (issue.following) {
      return html`<button
        type="button"
        class="aiux-btn aiux-btn-sm aiux-btn-ghost"
        @click=${() => navigate(`/requests/${issue.following.sysId}`)}
      >
        ${i18n.getMessage('Following with {0}', issue.following.number)}
      </button>`;
    }
    if (!issue.linkable) return nothing;
    if (this._confirming === issue.sysId) {
      return html`<span class="flex flex-wrap items-center gap-2">
        <span class="text-sm">${i18n.getMessage('Raise an incident linked to this issue? It closes when the issue is fixed.')}</span>
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${() => (this._confirming = '')}>
          ${i18n.getMessage('Cancel')}
        </button>
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-primary" ?disabled=${!!this._joining} @click=${() => this._join(issue)}>
          ${this._joining === issue.sysId ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
          ${i18n.getMessage('Yes, I am affected')}
        </button>
      </span>`;
    }
    return html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => (this._confirming = issue.sysId)}>
      ${i18n.getMessage('I am affected too')}
    </button>`;
  }

  // A slim strip above everything else: one line per issue, its latest update and "I am affected too"
  render() {
    if (!this._issues.length) return nothing;
    return html`<section class="flex flex-col gap-2" aria-labelledby="known-issues-title">
      <h2 id="known-issues-title" class="sr-only">${i18n.getMessage('Happening now')}</h2>
      ${this._error ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm" role="alert">${this._error}</div>` : nothing}
      <ul class="flex flex-col gap-2">
        ${this._issues.map(
          issue => html`<li class="aiux-alert aiux-alert-warning aiux-alert-soft flex flex-wrap items-center gap-x-3 gap-y-2">
            <span class="shrink-0 text-warning">${icon({name: 'triangle-exclamation', size: 'sm'})}</span>
            <div class="flex min-w-0 flex-1 basis-72 flex-col">
              <span class="break-words text-sm">
                <span class="font-semibold">${i18n.getMessage('Happening now')}:</span> ${issue.title}
              </span>
              <span class="line-clamp-1 break-words text-xs" title=${issue.update || ''}>
                ${issue.update
                  ? i18n.getMessage('Since {0} · {1}', issue.since, issue.update)
                  : i18n.getMessage('Our team has been working on it since {0}', issue.since)}
              </span>
            </div>
            ${this._renderActions(issue)}
          </li>`
        )}
      </ul>
    </section>`;
  }
}
