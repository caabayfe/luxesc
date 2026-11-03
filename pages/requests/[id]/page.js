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
import {fetchRecord, fetchRecords} from '../../../utils/api.js';
import '../../../components/luxesc-ask.js';
import '../../../components/luxesc-comment-draft.js';
import '../../../components/luxesc-journey.js';
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
// The variable editor formatter lives on the default view of sc_req_item, and so do its
// comments and activity: its self-service view has neither
const VARIABLES_VIEW = 'default';
const ACTIVITY_VIEW = {sc_req_item: 'default'};
// Enough of the comment history for the assistant to summarise it
const COMMENTS_CHARS = 3000;

// The comments' display value is the history the requester can read, with some HTML and [code] markup
function plainComments(value = '') {
  return value
    .replace(/\[\/?code\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, COMMENTS_CHARS);
}

@customElement('x-everi-luxesc-ticket-page')
@title('Request')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class TicketPage extends withWidgetContext(AIUXElement) {
  static contexts = [chatContext];

  static aiContext = {
    description:
      "One of the employee's requests or incidents: what was asked for, number, state and stage, dates, assignment, approval, service levels (SLAs: stage, due by, time left, breached) and the comment history the employee can read",
    bestFor:
      'When the employee asks about the status of this request, when it will be done, what has happened, or wants to add information or chase it up. Answer with a short heading per part (for example Status, Timeline, Next step) and bullet points, never one long paragraph. When a message to the people working on it would help (chasing up, answering their question, adding details), draft it and use propose_comment, then tell the employee it is waiting in the comment box for them to send.'
  };

  // Never posts: the employee sends the draft from the comment box
  static client_tools = {
    propose_comment: {
      description:
        "Put a comment you drafted for this request into the comment box on the page (a chase-up, an answer to the people working on it, or details the employee wants to add). The employee reviews it and sends it themselves. Write it as the employee, in their language.",
      arguments: [
        {name: 'text', description: 'The comment, written as the employee', type: 'string', required: true}
      ],
      definition: async function ({text} = {}) {
        const comment = String(text || '').trim();
        if (!comment) return {success: false, reason: 'Nothing to propose'};
        const draft = this.renderRoot.querySelector('luxesc-comment-draft');
        if (!draft?.propose(comment)) return {success: false, reason: 'You cannot comment on this request'};
        return {success: true};
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
      const activity = ACTIVITY_VIEW[table]
        ? await RecordDataManager.fetchRecord(
            {table, sysId, view: ACTIVITY_VIEW[table], ignoreUserViewPreference: true, isCoreUI: false},
            [RecordAPIKey.Form, RecordAPIKey.Activity]
          ).catch(error => {
            log.error({error: error.message, table, sysId}, 'Failed to load activity');
            return null;
          })
        : record;
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
      // A requested item's short description is the catalog blurb; its item name says what was asked for
      const item =
        table === 'sc_req_item' ? await fetchRecord(table, sysId, 'cat_item,stage').catch(() => null) : null;
      const comments = (await fetchRecord(table, sysId, 'comments').catch(() => null))?.comments?.display_value;
      const slas = await fetchSlas(sysId);
      return {
        basePath,
        summary,
        record,
        activity,
        variables,
        table,
        slas,
        itemName: item?.cat_item?.display_value || '',
        stage: item?.stage?.display_value || '',
        comments: plainComments(comments)
      };
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
        askedFor: this.loaderData.itemName || value('short_description'),
        number: value('number'),
        type: value('sys_class_name'),
        summary: value('short_description'),
        description: value('description').slice(0, 1000),
        state: value('state'),
        stage: this.loaderData.stage,
        open: summary.active?.value === 'true',
        openedAt: value('opened_at'),
        updatedAt: value('sys_updated_on'),
        assignedGroup: value('assignment_group'),
        dueDate: value('due_date'),
        approval: value('approval')
      },
      slas: this.loaderData.slas || [],
      commentHistory: this.loaderData.comments || 'No comments yet'
    });
  }

  _renderAssist(summary) {
    if (!isChatEnabled()) return nothing;
    const number = summary.number?.display_value;
    const suggestions = [
      {label: i18n.getMessage('Where is it now?'), question: i18n.getMessage('Where is {0} now: its stage, who is handling it and what happens next?', number)},
      {label: i18n.getMessage('When will it be done?'), question: i18n.getMessage('When will {0} be done? Use its due date and service levels, and say whether it is on track.', number)},
      {label: i18n.getMessage('Summarize the activity'), question: i18n.getMessage('Summarize the activity on {0}: its status, a short timeline of the updates and comments, and what happens next.', number)},
      ...(summary.active?.value === 'true'
        ? [{label: i18n.getMessage('Chase it up'), question: i18n.getMessage('Draft a short, polite comment asking for an update on {0} and put it in the comment box for me to send.', number)}]
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

  _title(summary) {
    return this.loaderData?.itemName || summary.short_description?.display_value || summary.number?.display_value;
  }

  _renderHeader(summary) {
    const basePath = this.loaderData?.basePath || '';
    const active = summary.active?.value === 'true';
    return html`<header class="flex flex-col gap-3">
      <nav class="aiux-breadcrumbs text-sm" aria-label=${i18n.getMessage('Breadcrumb')}>
        <ul>
          <li><a href="${basePath}/start">${i18n.getMessage('For you')}</a></li>
          <li><a href="${basePath}/requests">${i18n.getMessage('My stuff')}</a></li>
          <li aria-current="page">${summary.number?.display_value}</li>
        </ul>
      </nav>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="max-w-full break-words text-2xl font-bold">
          ${this._title(summary)}
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
    const {summary, record, activity, variables, table} = this.loaderData || {};
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
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_24rem]">
        <section
          class="aiux-card min-w-0 bg-base-100 shadow-sm"
          aria-labelledby="activity-title"
        >
          <div class="aiux-card-body gap-4">
            <h2 id="activity-title" class="aiux-card-title text-base">
              ${i18n.getMessage('Activity')}
            </h2>
            ${activity
              ? html`<aiux-record-provider .data=${activity} disable-presence>
                  <luxesc-comment-draft></luxesc-comment-draft>
                  <aiux-record-activity-layout force-stacked disable-preserve-layout>
                    <aiux-record-activity-compose main></aiux-record-activity-compose>
                    <aiux-record-activity-stream
                      sortdirection="newest"
                      hideconfigurefields
                    ></aiux-record-activity-stream>
                  </aiux-record-activity-layout>
                </aiux-record-provider>`
              : html`<p class="text-sm text-text-secondary">${i18n.getMessage('The activity is not available right now.')}</p>`}
          </div>
        </section>
        <aiux-record-provider .data=${record} disable-presence>
          <div class="flex min-w-0 flex-col gap-6">
            <section class="aiux-card bg-base-100 shadow-sm" aria-labelledby="journey-title">
              <div class="aiux-card-body gap-3">
                <h2 id="journey-title" class="aiux-card-title text-base">${i18n.getMessage('Where it is')}</h2>
                <luxesc-journey
                  task-id=${sysId}
                  label=${this._title(summary)}
                  hide-update
                ></luxesc-journey>
              </div>
            </section>
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
        </aiux-record-provider>
      </div>
    </div>`;
  }
}
