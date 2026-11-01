import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-list';
import '@servicenow/aiux/aiux-components-tabs';
import {ListDataManager} from '@servicenow/aiux/aiux-components-list';
import {REQUEST_CLASSES} from '../../constants/catalog.js';
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
export default class RequestsPage extends AIUXElement {
  @state() _filter = 'open';

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
    if (QUERIES[id]) this._filter = id;
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
        <aiux-list-connected
          table="task"
          columns=${COLUMNS}
          .query=${QUERIES[this._filter]}
          .data=${this._filter === 'open' ? this.loaderData?.data : null}
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
            showCopyURLButton: false
          }}
          @aiux-list-connected:reference-link-clicked=${this._open}
        ></aiux-list-connected>
      </div>
    </div>`;
  }
}
