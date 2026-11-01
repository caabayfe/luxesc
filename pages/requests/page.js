import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {keyed} from 'lit/directives/keyed.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  withWidgetContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-list';
import '@servicenow/aiux/aiux-components-tabs';
import {ListDataManager} from '@servicenow/aiux/aiux-components-list';
import {REQUEST_CLASSES} from '../../constants/catalog.js';
import {fetchRecords} from '../../utils/api.js';
import {setDocumentTitle} from '../../utils/document-title.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-requests');

const COLUMNS = 'number,short_description,sys_class_name,state,sys_updated_on';
const MINE = `opened_by=javascript:gs.getUserID()^sys_class_nameIN${REQUEST_CLASSES.join(',')}`;
const QUERIES = {
  open: `active=true^${MINE}^ORDERBYDESCsys_updated_on`,
  closed: `active=false^${MINE}^ORDERBYDESCsys_updated_on`
};

@customElement('x-everi-luxesc-requests-page')
@title('My requests')
@acl([{roles: ['snc_internal']}])
export default class RequestsPage extends withWidgetContext(AIUXElement) {
  @state() _filter = 'open';

  static aiContext = {
    description: "The employee's requests and incidents, split into open and closed tabs",
    bestFor: 'When the employee wants to review, find or open their requests'
  };

  static client_tools = {
    show_tab: {
      description: 'Switch the list between open and closed requests.',
      arguments: [{name: 'tab', description: '"open" or "closed"', type: 'string', required: true}],
      definition: async function ({tab} = {}) {
        if (!QUERIES[tab]) return {success: false, reason: 'tab must be "open" or "closed"'};
        this._filter = tab;
        this.setAiContext({tab});
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

  // aiux-list-connected inherits the nav layout's height chain
  static styles = css`
    :host {
      display: contents;
    }
  `;

  static async loader() {
    const data = await ListDataManager.fetch({
      table: 'task',
      query: QUERIES.open,
      columns: COLUMNS
    }).catch(error => {
      log.error({error: error?.message}, 'Failed to load requests');
      return null;
    });
    return {data};
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('My requests'));
  }

  _onTab(e) {
    const id = e.detail?.id;
    if (QUERIES[id]) {
      this._filter = id;
      this.setAiContext({tab: id});
    }
  }

  _open(e) {
    const {referenceTable, referenceSysId, metadata} = e.detail || {};
    // Number links point at the row itself; other links (e.g. users) stay put
    const sysId =
      !referenceTable || referenceTable === 'task'
        ? referenceSysId || metadata?.listSysId
        : metadata?.listSysId;
    if (sysId) navigate(`/requests/${sysId}`);
  }

  // Each tab gets its own list instance so switching refetches its rows
  render() {
    const tabs = [
      {id: 'open', label: i18n.getMessage('Open')},
      {id: 'closed', label: i18n.getMessage('Closed')}
    ];
    return html`<div class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 p-4 lg:p-8">
      <h1 class="text-2xl font-bold">${i18n.getMessage('My requests')}</h1>
      <aiux-tab-group
        .tabs=${tabs}
        .activeTab=${this._filter}
        tablist-label=${i18n.getMessage('Request status')}
        @aiux-tab-group:tab-change=${this._onTab}
      ></aiux-tab-group>
      <div class="aiux-card flex min-h-0 flex-1 border border-base-300 bg-base-100">
        ${keyed(this._filter, html`<aiux-list-connected
          table="task"
          columns=${COLUMNS}
          .query=${QUERIES[this._filter]}
          .data=${this._filter === 'open' ? this.loaderData?.data : undefined}
          .listOptions=${{
            heading:
              this._filter === 'open'
                ? i18n.getMessage('Open requests')
                : i18n.getMessage('Closed requests'),
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
          @aiux-list-connected:reference-link-clicked=${this._open}
        ></aiux-list-connected>`)}
      </div>
    </div>`;
  }
}
