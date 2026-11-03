import {html, css, nothing, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  withWidgetContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {attachmentUrl, fetchRecords, updateRecord} from '../../../utils/api.js';
import {callConcierge} from '../../../utils/agent-runs.js';
import '../../../components/luxesc-ask.js';
import '../../../components/luxesc-ticket-conversation.js';
import {setDocumentTitle} from '../../../utils/document-title.js';
import {chatContext, isChatEnabled} from '../../../utils/chat.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-ticket');

const SLA_FIELDS = 'sla,stage,has_breached,planned_end_time,business_percentage,business_time_left';
// Enough of the conversation for the assistant to summarise it
const THREAD_CHARS = 3000;

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

// The employee's view of the record: facts, answers, files and customer-visible comments only
async function fetchTicket(sysId) {
  return (await callConcierge(`/tickets/${sysId}`))?.ticket || null;
}

function fileSize(bytes) {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return new Intl.NumberFormat(undefined, {style: 'unit', unit: units[unit], unitDisplay: 'short', maximumFractionDigits: 0}).format(size);
}

// Colour of a journey step: done, the current one (by its tone), still to come.
// Whole class names, so the styles build finds them
const CURRENT_TONE = {
  info: {bar: 'border-info', text: 'text-info'},
  warning: {bar: 'border-warning', text: 'text-warning'},
  error: {bar: 'border-error', text: 'text-error'}
};

function stepTone(step) {
  if (step.state === 'done') return {bar: 'border-success', text: 'text-success', icon: 'circle-check'};
  if (step.state === 'current') return {...(CURRENT_TONE[step.tone] || CURRENT_TONE.info), icon: 'circle-half'};
  return step.tone === 'warning'
    ? {bar: 'border-base-300', text: 'text-warning', icon: 'calendar-triangle-exclamation'}
    : {bar: 'border-base-300', text: 'text-text-secondary', icon: 'circle-dashed'};
}

/**
 * One of the employee's requests or incidents, the same way for both: a header
 * with its status and journey (and, for a resolved incident, whether the fix
 * worked), the conversation with the people working on it, and beside it the
 * assistant, what they asked for, the facts that matter and the files. It shows
 * what the employee can see, never work notes, whatever roles they have.
 */
@customElement('x-everi-luxesc-ticket-page')
@title('Request')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class TicketPage extends withWidgetContext(AIUXElement) {
  static contexts = [chatContext];

  static aiContext = {
    description:
      "One of the employee's requests or incidents: what was asked for and the answers given when ordering, number, state, where it is in its journey, who handles it, dates, service levels (SLAs: stage, due by, time left, breached) and the conversation (comments and files) the employee can see",
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
        if (!this._conversation?.propose(comment)) return {success: false, reason: 'You cannot comment on this request'};
        return {success: true};
      }
    }
  };

  // The ticket read again after the employee changed it (a comment, a file, closing it)
  @state() _fresh = null;
  // Confirming a fix: '', 'confirm', 'busy' or an error message
  @state() _closing = '';

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
      const [ticket, slas] = await Promise.all([fetchTicket(sysId), fetchSlas(sysId)]);
      return {basePath, ticket, slas};
    } catch (error) {
      log.error({error: error.message, sysId}, 'Failed to load request');
      return {basePath, ticket: null, slas: []};
    }
  }

  get _ticket() {
    return this._fresh || this.loaderData?.ticket || null;
  }

  get _conversation() {
    return this.renderRoot.querySelector('luxesc-ticket-conversation');
  }

  willUpdate(changed) {
    super.willUpdate?.(changed);
    // Another record opened in place: forget what was read for the previous one
    if (this._fresh && this._fresh.sysId !== this.loaderData?.ticket?.sysId) {
      this._fresh = null;
      this._closing = '';
    }
  }

  // loaderData is not a reactive property, so a new ticket is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    const ticket = this._ticket;
    if (isServer || !ticket || ticket === this._contextTicket) return;
    this._contextTicket = ticket;
    setDocumentTitle(ticket.number);
    const thread = ticket.thread
      .map(entry => `${entry.you ? 'Employee' : entry.author} (${entry.at}): ${entry.kind === 'file' ? `added the file ${entry.text}` : entry.text}`)
      .join('\n')
      .slice(0, THREAD_CHARS);
    this.setAiContext({
      request: {
        askedFor: ticket.title,
        number: ticket.number,
        type: ticket.type,
        summary: ticket.summary,
        description: ticket.description.slice(0, 1000),
        state: ticket.state,
        stage: ticket.stage,
        open: ticket.open,
        openedAt: ticket.openedAt,
        updatedAt: ticket.updatedAt,
        whereItIs: ticket.journey?.status || '',
        journey: (ticket.journey?.steps || []).map(step => `${step.label} (${step.state}${step.at ? `, ${step.at}` : ''})`),
        facts: Object.fromEntries(ticket.facts.map(fact => [fact.label, fact.value])),
        answers: Object.fromEntries(ticket.answers.map(answer => [answer.question, answer.answer]))
      },
      slas: this.loaderData?.slas || [],
      conversation: thread || 'No comments yet, newest first',
      files: ticket.files.map(file => file.name)
    });
  }

  async _reload() {
    const sysId = this._ticket?.sysId;
    try {
      const ticket = await fetchTicket(sysId);
      if (ticket && ticket.sysId === this._ticket?.sysId) this._fresh = ticket;
    } catch (error) {
      log.warn({error: error.message}, 'Could not read the request again');
    }
  }

  async _closeFixed() {
    this._closing = 'busy';
    try {
      // Accepting the resolution closes the incident
      await updateRecord('incident', this._ticket.sysId, {state: '7'});
      this._closing = '';
      await this._reload();
    } catch (error) {
      log.error({error: error.message}, 'Closing failed');
      this._closing = i18n.getMessage('That did not work: {0}', error.message);
    }
  }

  // A caller's comment on a resolved incident reopens it (OOB)
  _notFixed() {
    this._closing = '';
    this._conversation?.ask(i18n.getMessage('What is still wrong? Your comment sends it back to the service desk.'));
  }

  _renderResolved() {
    const closing = this._closing;
    if (closing === 'confirm' || closing === 'busy') {
      return html`<div class="aiux-alert aiux-alert-success aiux-alert-soft flex flex-wrap items-center gap-2 text-sm">
        <span class="grow">${i18n.getMessage('Close {0}? You can still raise a new incident if it comes back.', this._ticket.number)}</span>
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" ?disabled=${closing === 'busy'} @click=${() => (this._closing = '')}>
          ${i18n.getMessage('Cancel')}
        </button>
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-success" ?disabled=${closing === 'busy'} @click=${this._closeFixed}>
          ${closing === 'busy' ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
          ${i18n.getMessage('Confirm: {0}', i18n.getMessage('Yes, it is fixed'))}
        </button>
      </div>`;
    }
    return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft flex flex-wrap items-center gap-2 text-sm">
      <span class="grow font-medium">${i18n.getMessage('The service desk says this is fixed. Is it working for you?')}</span>
      <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-secondary" @click=${() => (this._closing = 'confirm')}>
        ${i18n.getMessage('Yes, it is fixed')}
      </button>
      <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${this._notFixed}>
        ${i18n.getMessage('Still not fixed')}
      </button>
      ${closing ? html`<p class="w-full text-error" role="alert">${closing}</p>` : nothing}
    </div>`;
  }

  _renderJourney(ticket) {
    const steps = ticket.journey?.steps || [];
    if (!steps.length) return nothing;
    const stateLabel = {done: i18n.getMessage('Done'), current: i18n.getMessage('Now'), next: i18n.getMessage('Next')};
    return html`<ol class="flex flex-col gap-2 @2xl:flex-row @2xl:gap-3" aria-label=${i18n.getMessage('Progress of {0}', ticket.title)}>
      ${steps.map(step => {
        const tone = stepTone(step);
        return html`<li
          class="flex min-w-0 flex-1 gap-2 border-s-4 ps-3 @2xl:flex-col @2xl:gap-1 @2xl:border-s-0 @2xl:border-t-4 @2xl:ps-0 @2xl:pt-2 ${tone.bar}"
          aria-current=${step.state === 'current' ? 'step' : 'false'}
        >
          <span class="flex items-center gap-1.5 text-sm ${{current: 'font-semibold', next: 'text-text-secondary', done: 'text-base-content'}[step.state]}">
            <span class=${tone.text}>${icon({name: tone.icon, size: 'sm'})}</span>
            <span class="sr-only">${stateLabel[step.state]}:</span>
            <span class="min-w-0 break-words">${step.label}</span>
          </span>
          ${step.at || step.short
            ? html`<span class="text-xs ${step.tone === 'warning' ? 'font-medium text-warning' : 'text-text-secondary'} @2xl:ps-6">
                ${[step.at, step.short].filter(Boolean).join(' · ')}
              </span>`
            : nothing}
        </li>`;
      })}
    </ol>`;
  }

  _renderHeader(ticket) {
    const basePath = this.loaderData?.basePath || '';
    return html`<header class="flex flex-col gap-4">
      <nav class="aiux-breadcrumbs text-sm" aria-label=${i18n.getMessage('Breadcrumb')}>
        <ul>
          <li><a href="${basePath}/start">${i18n.getMessage('For you')}</a></li>
          <li><a href="${basePath}/requests">${i18n.getMessage('My stuff')}</a></li>
          <li aria-current="page">${ticket.number}</li>
        </ul>
      </nav>
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="max-w-full break-words text-2xl font-bold">${ticket.title}</h1>
          <span
            class=${classMap({
              'aiux-badge': true,
              'aiux-badge-soft': true,
              'aiux-badge-warning': ticket.resolved,
              'aiux-badge-info': ticket.open && !ticket.resolved,
              'aiux-badge-success': !ticket.open
            })}
          >
            ${ticket.state}
          </span>
        </div>
        <p class="text-sm text-text-secondary">
          ${i18n.getMessage('{0} · {1} · Opened {2} · Updated {3}', ticket.type, ticket.number, ticket.openedAt, ticket.updatedAt)}
        </p>
      </div>
      ${this._renderJourney(ticket)} ${ticket.resolved ? this._renderResolved() : nothing}
    </header>`;
  }

  _renderAssist(ticket) {
    if (!isChatEnabled()) return nothing;
    const number = ticket.number;
    const suggestions = [
      {label: i18n.getMessage('Where is it now?'), question: i18n.getMessage('Where is {0} now: its stage, who is handling it and what happens next?', number)},
      {label: i18n.getMessage('When will it be done?'), question: i18n.getMessage('When will {0} be done? Use its due date and service levels, and say whether it is on track.', number)},
      {label: i18n.getMessage('Summarize the activity'), question: i18n.getMessage('Summarize the activity on {0}: its status, a short timeline of the updates and comments, and what happens next.', number)},
      ...(ticket.open && ticket.canComment
        ? [{label: i18n.getMessage('Chase it up'), question: i18n.getMessage('Draft a short, polite comment asking for an update on {0} and put it in the comment box for me to send.', number)}]
        : [])
    ];
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="assist-title">
      <div class="aiux-card-body gap-3 p-4">
        <h2 id="assist-title" class="aiux-card-title flex items-center gap-2 text-base">
          <span class="text-info">${icon({name: 'ai-sparkle', size: 'sm'})}</span>
          ${i18n.getMessage('Ask about this request')}
        </h2>
        <luxesc-ask
          label=${i18n.getMessage('Ask about this request')}
          placeholder=${i18n.getMessage('Ask anything about {0}', number)}
          prefix=${i18n.getMessage('About my request {0}:', number)}
          .suggestions=${suggestions}
        ></luxesc-ask>
      </div>
    </section>`;
  }

  _card(id, heading, body, action = nothing) {
    return html`<section class="aiux-card bg-base-100 shadow-sm" aria-labelledby=${id}>
      <div class="aiux-card-body gap-3 p-4">
        <div class="flex items-center justify-between gap-2">
          <h2 id=${id} class="aiux-card-title text-base">${heading}</h2>
          ${action}
        </div>
        ${body}
      </div>
    </section>`;
  }

  _renderPairs(pairs) {
    return html`<dl class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-2 text-sm">
      ${pairs.map(
        ([term, value]) => html`<dt class="break-words text-text-secondary">${term}</dt>
          <dd class="m-0 break-words font-medium">${value}</dd>`
      )}
    </dl>`;
  }

  _renderAskedFor(ticket) {
    if (ticket.answers.length) {
      return this._card(
        'asked-title',
        i18n.getMessage('What you asked for'),
        this._renderPairs(ticket.answers.map(answer => [answer.question, answer.answer]))
      );
    }
    if (ticket.description && ticket.description !== ticket.summary) {
      return this._card(
        'asked-title',
        i18n.getMessage('What you told us'),
        html`<p class="m-0 line-clamp-[12] whitespace-pre-line break-words text-sm">${ticket.description}</p>`
      );
    }
    return nothing;
  }

  _renderDetails(ticket) {
    if (!ticket.facts.length) return nothing;
    return this._card(
      'details-title',
      i18n.getMessage('Details'),
      this._renderPairs(ticket.facts.map(fact => [fact.label, fact.value]))
    );
  }

  _renderFiles(ticket) {
    const files = ticket.files;
    if (!files.length && !ticket.open) return nothing;
    const add = ticket.open
      ? html`<button type="button" class="aiux-btn aiux-btn-xs aiux-btn-ghost" @click=${() => this._conversation?.pickFiles()}>
          ${icon({name: 'plus', size: 'sm'})} ${i18n.getMessage('Add')}
        </button>`
      : nothing;
    const body = files.length
      ? html`<ul class="flex flex-col gap-1">
          ${files.map(
            file => html`<li>
              <a
                class="flex items-center gap-2 rounded-box px-2 py-1.5 text-sm hover:bg-base-200"
                href=${attachmentUrl(file.sysId)}
                target="_blank"
                rel="noopener"
              >
                <span class="text-text-secondary">${icon({name: 'document-blank', size: 'sm'})}</span>
                <span class="min-w-0 grow truncate" title=${file.name}>${file.name}</span>
                <span class="shrink-0 text-xs text-text-secondary">${fileSize(file.size)}</span>
              </a>
            </li>`
          )}
        </ul>`
      : html`<p class="text-sm text-text-secondary">${i18n.getMessage('No files yet. Add screenshots or documents that help.')}</p>`;
    return this._card(
      'files-title',
      files.length ? i18n.getMessage('Attachments ({0})', String(files.length)) : i18n.getMessage('Attachments'),
      body,
      add
    );
  }

  render() {
    const ticket = this._ticket;
    if (!ticket) {
      return html`<div class="mx-auto max-w-3xl p-4 lg:p-8">
        <aiux-empty-state-content
          heading=${i18n.getMessage('This request is not available')}
          body=${i18n.getMessage('It may have been removed, or you do not have access to it.')}
        ></aiux-empty-state-content>
      </div>`;
    }

    return html`<div class="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:p-8">
      ${this._renderHeader(ticket)}
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="aiux-card min-w-0 bg-base-100 shadow-sm" aria-labelledby="conversation-title">
          <div class="aiux-card-body gap-4">
            <h2 id="conversation-title" class="aiux-card-title text-base">${i18n.getMessage('Conversation')}</h2>
            <luxesc-ticket-conversation
              table=${ticket.table}
              record-id=${ticket.sysId}
              opened-at=${ticket.openedAt}
              .thread=${ticket.thread}
              ?can-comment=${ticket.canComment}
              ?can-attach=${ticket.open}
              @luxesc-ticket-conversation:changed=${this._reload}
            ></luxesc-ticket-conversation>
          </div>
        </section>
        <aside class="flex min-w-0 flex-col gap-4" aria-label=${i18n.getMessage('About this request')}>
          ${this._renderAssist(ticket)} ${this._renderAskedFor(ticket)} ${this._renderDetails(ticket)}
          ${this._renderFiles(ticket)}
        </aside>
      </div>
    </div>`;
  }
}
