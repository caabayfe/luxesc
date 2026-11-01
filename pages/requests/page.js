import {html, css, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  withWidgetContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-empty-state-content';
import '@servicenow/aiux/aiux-components-list';
import '@servicenow/aiux/aiux-components-tabs';
import {REQUEST_CLASSES} from '../../constants/catalog.js';
import {callConcierge} from '../../utils/agent-runs.js';
import {fetchRecords} from '../../utils/api.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import {needsYou} from '../../utils/record-actions.js';
import '../../components/luxesc-record-list.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-my-stuff');

const TABS = ['need', 'open', 'done'];
const DONE_COLUMNS = 'number,short_description,sys_class_name,state,sys_updated_on';
const MINE = `opened_by=javascript:gs.getUserID()^sys_class_nameIN${REQUEST_CLASSES.join(',')}`;
const DONE_QUERY = `active=false^${MINE}^ORDERBYDESCsys_updated_on`;

// Late or stuck records first, then the most recently updated
const byAttention = (a, b) => Number(!!b.attention) - Number(!!a.attention);

/**
 * My stuff: everything the employee has going on. Needs you (approvals, fixes
 * to confirm, questions from the service desk), Open (requests and incidents,
 * each saying where it is, with its journey on demand) and Done (the OOB list
 * of closed records).
 */
@customElement('x-everi-luxesc-requests-page')
@title('My stuff')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class MyStuffPage extends withWidgetContext(AIUXElement) {
  @state() _tab = '';

  static aiContext = {
    description: "The employee's requests, incidents and approvals: what needs them, what is open (with where each one is) and what is done",
    bestFor: 'When the employee wants to review, find, follow up or act on their requests, incidents or approvals'
  };

  static client_tools = {
    show_tab: {
      description: 'Switch My stuff to one tab: "need" (needs the employee), "open" or "done".',
      arguments: [{name: 'tab', description: '"need", "open" or "done"', type: 'string', required: true}],
      definition: async function ({tab} = {}) {
        if (!TABS.includes(tab)) return {success: false, reason: 'tab must be "need", "open" or "done"'};
        this._tab = tab;
        return {success: true};
      }
    },
    open_request: {
      description: 'Open one of the employee\'s requests or incidents by its number.',
      arguments: [{name: 'number', description: 'Request or incident number', type: 'string', required: true}],
      definition: async function ({number} = {}) {
        const [found] = await fetchRecords('task', {
          encodedQuery: `number=${String(number || '').trim()}^${MINE}`,
          fields: 'sys_id',
          limit: 1
        }).catch(() => []);
        if (!found) return {success: false, reason: `${number} is not one of your requests`};
        navigate(`/requests/${found.sys_id.value}`);
        return {success: true};
      }
    }
  };

  // aiux-list-connected (Done) inherits the nav layout's height chain
  static styles = css`
    :host {
      display: contents;
    }
  `;

  static async loader(ctx) {
    try {
      const result = await callConcierge('/mine');
      return {basePath: ctx.basePath || '', items: result?.items || []};
    } catch (error) {
      log.error({error: error.message}, 'Failed to load my stuff');
      return {basePath: ctx.basePath || '', items: null};
    }
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('My stuff'));
  }

  get _groups() {
    const items = this.loaderData?.items || [];
    return {
      need: items.filter(needsYou),
      open: items.filter(item => !needsYou(item)).sort(byAttention)
    };
  }

  updated(changed) {
    super.updated?.(changed);
    if (isServer || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    const {need, open} = this._groups;
    const brief = item => ({number: item.number, title: item.title, status: item.status || item.kind});
    this.setAiContext({needsYou: need.map(brief), open: open.map(brief)});
  }

  _renderList(items, label, empty) {
    if (this.loaderData?.items === null) {
      return html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
        ${i18n.getMessage('Your requests could not be loaded.')}
      </div>`;
    }
    if (!items.length) return html`<aiux-empty-state-content heading=${empty.heading} body=${empty.body}></aiux-empty-state-content>`;
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-label=${label}>
      <div class="aiux-card-body py-2">
        <luxesc-record-list .items=${items} label=${label}></luxesc-record-list>
      </div>
    </section>`;
  }

  _renderDone() {
    return html`<div class="aiux-card flex min-h-[28rem] flex-1 border border-base-300 bg-base-100">
      <aiux-list-connected
        table="task"
        columns=${DONE_COLUMNS}
        .query=${DONE_QUERY}
        .listOptions=${{
          heading: i18n.getMessage('Done'),
          selectionEnabled: false,
          selectAllEnabled: false,
          showCount: true,
          showRefreshButton: true,
          showZingSearch: true,
          showConditionBuilderButton: false,
          showEditColumnsButton: false,
          showCopyURLButton: false,
          showEditRowAction: false
        }}
        @aiux-list-connected:reference-link-clicked=${this._openDone}
      ></aiux-list-connected>
    </div>`;
  }

  _openDone(e) {
    const {referenceTable, referenceSysId, metadata} = e.detail || {};
    // Number links point at the row itself; other links (e.g. users) stay put
    const sysId = !referenceTable || referenceTable === 'task' ? referenceSysId || metadata?.listSysId : metadata?.listSysId;
    if (sysId) navigate(`/requests/${sysId}`);
  }

  render() {
    const {need, open} = this._groups;
    // Opens on Needs you when something waits on the employee
    const tab = this._tab || (need.length ? 'need' : 'open');
    const tabs = [
      {id: 'need', label: i18n.getMessage('Needs you ({0})', need.length)},
      {id: 'open', label: i18n.getMessage('Open ({0})', open.length)},
      {id: 'done', label: i18n.getMessage('Done')}
    ];
    return html`<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-4 lg:p-8">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div class="flex min-w-0 flex-col gap-1">
          <h1 class="text-3xl font-bold">${i18n.getMessage('My stuff')}</h1>
          <p class="text-text-secondary">${i18n.getMessage('Your requests, incidents and approvals, and where each one is.')}</p>
        </div>
        <a class="aiux-btn aiux-btn-outline" href="${this.loaderData?.basePath || ''}/explore">${i18n.getMessage('Request something')}</a>
      </header>
      <aiux-tab-group
        variant="bordered"
        tablist-label=${i18n.getMessage('Request status')}
        .tabs=${tabs}
        .activeTab=${tab}
        @aiux-tab-group:tab-change=${e => (this._tab = e.detail.id)}
      ></aiux-tab-group>
      ${tab === 'done'
        ? this._renderDone()
        : tab === 'need'
          ? this._renderList(need, tabs[0].label, {
              heading: i18n.getMessage('Nothing needs you right now'),
              body: i18n.getMessage('Approvals, fixes to confirm and questions from the service desk will show up here.')
            })
          : this._renderList(open, tabs[1].label, {
              heading: i18n.getMessage('Nothing open'),
              body: i18n.getMessage('When you ask for something or report a problem, you can follow it here.')
            })}
    </div>`;
  }
}
