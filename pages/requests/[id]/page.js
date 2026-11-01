import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  withWidgetContext
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
import {addComment, fetchRecord, fetchRecords} from '../../../utils/api.js';
import '../../../components/luxesc-ask.js';
import {setDocumentTitle} from '../../../utils/document-title.js';
import {chatContext, isChatEnabled} from '../../../utils/chat.js';
import {lockVariables} from '../../../utils/read-only-variables.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-ticket');

const SLA_FIELDS = 'sla,stage,has_breached,planned_end_time,business_percentage,business_time_left';

// Service levels on the record, so the assistant can say when it should be done.
// Requesters often cannot read task_sla; then there is simply nothing to tell.
async function fetchSlas(sysId) {
  const slas = await fetchRecords('task_sla', {
    encodedQuery: `task=${sysId}^ORDERBYplanned_end_time`,
    fields: SLA_FIELDS,
    limit: 5
  }).catch(() => null);
  return (slas || []).map(sla => ({
    name: sla.sla.display_value,
    stage: sla.stage.display_value,
    breached: sla.has_breached.value === 'true',
    dueBy: sla.planned_end_time.display_value,
    elapsedPercent: sla.business_percentage.display_value,
    timeLeft: sla.business_time_left.display_value
  }));
}

const SUMMARY_FIELDS =
  'sys_id,sys_class_name,number,short_description,description,state,active,opened_at,sys_updated_on,assignment_group,due_date,approval';

// Self-service view; the platform falls back to the default view when a table has none
const ESS_VIEW = 'ess';
// The variable editor formatter lives on the default view of sc_req_item
const VARIABLES_VIEW = 'default';

@customElement('x-everi-luxesc-ticket-page')
@title('Request')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class TicketPage extends withWidgetContext(AIUXElement) {
  static contexts = [chatContext];

  static aiContext = {
    description: "One of the employee's requests or incidents: number, state, dates, assignment, approval and service levels (SLAs: stage, due by, time left, breached)",
    bestFor: 'When the employee asks about the status of this request, what happens next, or wants to add information or chase it up'
  };

  // Posts in the employee's name, so only on their explicit request
  static client_tools = {
    add_comment: {
      description:
        'Add a comment to this request, visible to the people working on it. Only use when the employee explicitly asks to add information or chase it up; show them the exact text first.',
      arguments: [
        {name: 'text', description: 'The comment, written as the employee', type: 'string', required: true}
      ],
      definition: async function ({text} = {}) {
        const comment = String(text || '').trim();
        const {summary, table} = this.loaderData || {};
        if (!comment || !summary) return {success: false, reason: 'Nothing to post'};
        try {
          await addComment(table, summary.sys_id.value, comment);
          return {success: true, posted: comment};
        } catch (error) {
          log.error({error: error.message}, 'Comment failed');
          return {success: false, reason: 'You cannot comment on this request'};
        }
      }
    }
  };

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
      const slas = await fetchSlas(sysId);
      return {basePath, summary, record, variables, table, slas};
    } catch (error) {
      log.error({error: error.message, sysId}, 'Failed to load request');
      return {basePath, summary: null, record: null};
    }
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    const summary = this.loaderData?.summary;
    if (isServer || !summary || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    const value = name => summary[name]?.display_value || '';
    this.setAiContext({
      request: {
        number: value('number'),
        type: value('sys_class_name'),
        summary: value('short_description'),
        description: value('description').slice(0, 1000),
        state: value('state'),
        open: summary.active?.value === 'true',
        openedAt: value('opened_at'),
        updatedAt: value('sys_updated_on'),
        assignedGroup: value('assignment_group'),
        dueDate: value('due_date'),
        approval: value('approval')
      },
      slas: this.loaderData.slas || []
    });
  }

  _renderAssist(summary) {
    if (!isChatEnabled()) return nothing;
    const number = summary.number?.display_value;
    const suggestions = [
      {label: i18n.getMessage('Where is it now?'), question: i18n.getMessage('What is the status of my request {0} and what happens next?', number)},
      {label: i18n.getMessage('When will it be done?'), question: i18n.getMessage('When can I expect {0} to be completed? Explain any SLA or due date.', number)},
      {label: i18n.getMessage('Summarize the activity'), question: i18n.getMessage('Summarize what has happened so far on {0}.', number)},
      ...(summary.active?.value === 'true'
        ? [{label: i18n.getMessage('Chase it up'), question: i18n.getMessage('Draft a short, polite comment asking for an update on {0}. Show it to me and post it on this request only after I confirm.', number)}]
        : [])
    ];
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="assist-title">
      <div class="aiux-card-body gap-3">
        <h2 id="assist-title" class="aiux-card-title text-base">${i18n.getMessage('Ask about this request')}</h2>
        <luxesc-ask
          label=${i18n.getMessage('Ask about this request')}
          placeholder=${i18n.getMessage('Ask anything about {0}', number)}
          prefix=${i18n.getMessage('About my request {0}:', number)}
          .suggestions=${suggestions}
        ></luxesc-ask>
      </div>
    </section>`;
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
          <li><a href="${basePath}/start">${i18n.getMessage('Home')}</a></li>
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
      ${this._renderHeader(summary)} ${this._renderAssist(summary)}
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
