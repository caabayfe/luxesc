import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {
  AIUXElement,
  decorators,
  getLogger
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import '@servicenow/aiux/aiux-components-record';
import {
  RecordDataManager,
  RecordAPIKey
} from '@servicenow/aiux/aiux-components-record';
import '@servicenow/aiux/aiux-components-catalog';
import '@servicenow/aiux/aiux-components-attachment';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchRecord} from '../../../utils/api.js';
import {setDocumentTitle} from '../../../utils/document-title.js';
import {lockVariables} from '../../../utils/read-only-variables.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-ticket');

const SUMMARY_FIELDS =
  'sys_id,sys_class_name,number,short_description,state,active,opened_at,sys_updated_on';

// Self-service view; the platform falls back to the default view when a table has none
const ESS_VIEW = 'ess';
// The variable editor formatter lives on the default view of sc_req_item
const VARIABLES_VIEW = 'default';

@customElement('x-everi-luxesc-ticket-page')
@title('Request')
@acl([{roles: ['snc_internal']}])
export default class TicketPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const sysId = ctx.params.id;
    const basePath = ctx.basePath || '';
    try {
      // The list links through task; the form needs the concrete class
      const summary = await fetchRecord('task', sysId, SUMMARY_FIELDS);
      if (!summary) return {basePath, summary: null, record: null};
      const table = summary.sys_class_name.value;
      const record = await RecordDataManager.fetchRecord(
        {table, sysId, view: ESS_VIEW, isCoreUI: false},
        [RecordAPIKey.Form, RecordAPIKey.Activity]
      ).catch(error => {
        log.error({error: error.message, table, sysId}, 'Failed to load record');
        return null;
      });
      const variables =
        table === 'sc_req_item'
          ? await RecordDataManager.fetchRecord(
              {table, sysId, view: VARIABLES_VIEW, ignoreUserViewPreference: true, isCoreUI: false},
              [RecordAPIKey.Form]
            ).then(lockVariables).catch(error => {
              log.error({error: error.message, sysId}, 'Failed to load variables');
              return null;
            })
          : null;
      return {basePath, summary, record, variables, table};
    } catch (error) {
      log.error({error: error.message, sysId}, 'Failed to load request');
      return {basePath, summary: null, record: null};
    }
  }

  firstUpdated() {
    const number = this.loaderData?.summary?.number?.display_value;
    setDocumentTitle(number || i18n.getMessage('Request'));
  }

  _renderHeader(summary) {
    const basePath = this.loaderData?.basePath || '';
    const active = summary.active?.value === 'true';
    return html`<header class="flex flex-col gap-3">
      <nav class="aiux-breadcrumbs text-sm" aria-label=${i18n.getMessage('Breadcrumb')}>
        <ul>
          <li><a href="${basePath}/home">${i18n.getMessage('Home')}</a></li>
          <li><a href="${basePath}/requests">${i18n.getMessage('My requests')}</a></li>
          <li aria-current="page">${summary.number?.display_value}</li>
        </ul>
      </nav>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="max-w-full break-words text-2xl font-bold">
          ${summary.short_description?.display_value || summary.number?.display_value}
        </h1>
        <span
          class=${classMap({
            'aiux-badge': true,
            'aiux-badge-soft': true,
            'aiux-badge-info': active,
            'aiux-badge-success': !active
          })}
        >
          ${summary.state?.display_value}
        </span>
      </div>
      <p class="text-sm text-text-secondary">
        ${i18n.getMessage(
          '{0} · Opened {1} · Updated {2}',
          summary.number?.display_value,
          summary.opened_at?.display_value || '',
          summary.sys_updated_on?.display_value || ''
        )}
      </p>
    </header>`;
  }

  render() {
    const {summary, record, variables, table} = this.loaderData || {};
    if (!summary || !record) {
      return html`<div class="mx-auto max-w-3xl p-4 lg:p-8">
        <aiux-empty-state-content
          heading=${i18n.getMessage('This request is not available')}
          body=${i18n.getMessage('It may have been removed, or you do not have access to it.')}
        ></aiux-empty-state-content>
      </div>`;
    }

    const sysId = summary.sys_id.value;
    return html`<div class="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:p-8">
      ${this._renderHeader(summary)}
      <aiux-record-provider .data=${record} disable-presence>
        <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_24rem]">
          <section
            class="aiux-card min-w-0 bg-base-100 shadow-sm"
            aria-labelledby="activity-title"
          >
            <div class="aiux-card-body gap-4">
              <h2 id="activity-title" class="aiux-card-title text-base">
                ${i18n.getMessage('Activity')}
              </h2>
              <aiux-record-activity-layout force-stacked disable-preserve-layout>
                <aiux-record-activity-compose main></aiux-record-activity-compose>
                <aiux-record-activity-stream
                  sortdirection="newest"
                  hideconfigurefields
                ></aiux-record-activity-stream>
              </aiux-record-activity-layout>
            </div>
          </section>
          <div class="flex min-w-0 flex-col gap-6">
            <section class="aiux-card bg-base-100 shadow-sm" aria-labelledby="details-title">
              <div class="aiux-card-body gap-2">
                <h2 id="details-title" class="aiux-card-title text-base">
                  ${i18n.getMessage('Details')}
                </h2>
                <aiux-record-form
                  layout-variant="flat"
                  edit-mode="display-only"
                  variant="compact"
                  hide-section-headers
                ></aiux-record-form>
              </div>
            </section>
            ${variables
              ? html`<section class="aiux-card bg-base-100 shadow-sm" aria-labelledby="variables-title">
                  <div class="aiux-card-body gap-2">
                    <h2 id="variables-title" class="aiux-card-title text-base">
                      ${i18n.getMessage('What you asked for')}
                    </h2>
                    <aiux-record-provider .data=${variables} disable-presence>
                      <aiux-catalog-form .noGutter=${true} .readOnlyOption=${'printable'}></aiux-catalog-form>
                    </aiux-record-provider>
                  </div>
                </section>`
              : nothing}
            <section class="aiux-card bg-base-100 shadow-sm" aria-labelledby="attachments-title">
              <div class="aiux-card-body gap-2">
                <h2 id="attachments-title" class="aiux-card-title text-base">
                  ${i18n.getMessage('Attachments')}
                </h2>
                <aiux-record-core-attachment
                  table=${table}
                  .sysId=${sysId}
                  mode="compact"
                ></aiux-record-core-attachment>
              </div>
            </section>
          </div>
        </div>
      </aiux-record-provider>
    </div>`;
  }
}
