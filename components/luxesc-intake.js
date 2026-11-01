import {html, css, nothing, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {getUser} from '@servicenow/aiux/aiux-utils';
import {GIVE_UP_MS, POLL_MS, callRuns} from '../utils/agent-runs.js';
import {createRecord} from '../utils/api.js';
import {stashPrefill} from '../utils/ai-handoff.js';
import './luxesc-agent-steps.js';

const log = getLogger('luxesc-intake');

function urgencies() {
  return [
    {value: '1', label: i18n.getMessage('High: my whole team is blocked')},
    {value: '2', label: i18n.getMessage('Medium: I am blocked')},
    {value: '3', label: i18n.getMessage('Low: I can keep working')}
  ];
}

/**
 * Fix it or report it: the Employee Intake agent reads the employee's
 * description, searches the knowledge base, similar fixed incidents and the
 * catalog, and comes back with self-help plus a drafted incident or catalog
 * request. Nothing is raised until the employee reviews and confirms it.
 */
@customElement('luxesc-intake')
export class Intake extends AIUXElement {
  @state() _text = '';
  @state() _run = null;
  @state() _error = '';
  @state() _starting = false;
  // 'help': self-help shown; 'escalate': the draft is shown; 'fixed': self-help worked
  @state() _stage = 'help';
  @state() _draft = null;
  @state() _creating = false;
  @state() _created = null;

  _timer = null;
  _startedAt = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  async _start(e) {
    e.preventDefault();
    const text = this._text.trim();
    if (!text || isServer) return;
    clearTimeout(this._timer);
    Object.assign(this, {_error: '', _starting: true, _stage: 'help', _draft: null, _created: null});
    try {
      this._run = await callRuns('/intake', {method: 'POST', body: {text}});
      this._startedAt = Date.now();
      if (this._run?.state === 'running') this._poll();
    } catch (error) {
      log.error({error: error.message}, 'Intake did not start');
      this._error = i18n.getMessage('The assistant could not look into this. Try again in a moment.');
    } finally {
      this._starting = false;
    }
  }

  _poll() {
    this._timer = setTimeout(async () => {
      try {
        this._run = await callRuns(`/runs/${this._run.id}`);
      } catch (error) {
        log.warn({error: error.message}, 'Intake progress unavailable');
      }
      if (this._run?.state !== 'running') return this._onFinished();
      if (Date.now() - this._startedAt > GIVE_UP_MS) {
        this._error = i18n.getMessage('This is taking longer than usual. Try again in a few minutes.');
        return;
      }
      this._poll();
    }, POLL_MS);
  }

  _onFinished() {
    const triage = this._run?.briefing;
    this._draft = triage?.recommendation?.incident ? {...triage.recommendation.incident} : null;
    // Without self-help there is nothing to try first
    this._stage = triage?.selfHelp ? 'help' : 'escalate';
  }

  _reset() {
    clearTimeout(this._timer);
    Object.assign(this, {_run: null, _text: '', _error: '', _draft: null, _created: null, _stage: 'help'});
  }

  _onDraftInput(name, e) {
    this._draft = {...this._draft, [name]: e.target.value};
  }

  async _raiseIncident(e) {
    e.preventDefault();
    const draft = this._draft;
    if (!draft?.shortDescription?.trim()) return;
    this._creating = true;
    this._error = '';
    try {
      this._created = await createRecord('incident', {
        caller_id: getUser()?.userId,
        short_description: draft.shortDescription.trim(),
        description: draft.description,
        category: draft.category,
        urgency: draft.urgency,
        contact_type: 'self-service'
      });
    } catch (error) {
      log.error({error: error.message}, 'Incident not created');
      this._error = i18n.getMessage('Your incident could not be raised: {0}', error.message);
    } finally {
      this._creating = false;
    }
  }

  _openCatalogItem(recommendation) {
    const {catalogItem, details} = recommendation;
    stashPrefill(catalogItem.sysId, {details: details || this._run.prompt});
    navigate(`/catalog/${catalogItem.sysId}`);
  }

  _renderForm() {
    return html`<form class="flex flex-col gap-2" aria-label=${i18n.getMessage("Describe the problem")} @submit=${this._start}>
      <label class="aiux-fieldset w-full">
        <span class="sr-only">${i18n.getMessage('Describe the problem')}</span>
        <textarea
          class="aiux-textarea w-full"
          rows="3"
          .value=${this._text}
          placeholder=${i18n.getMessage('For example: I cannot connect to the VPN from home since this morning')}
          @input=${e => (this._text = e.target.value)}
        ></textarea>
      </label>
      <button type="submit" class="aiux-btn aiux-btn-primary self-end" ?disabled=${!this._text.trim() || this._starting}>
        ${this._starting ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
        ${i18n.getMessage('Find a fix')}
      </button>
    </form>`;
  }

  _renderSelfHelp(selfHelp) {
    return html`<section class="aiux-card border border-base-300 bg-base-100" aria-labelledby="intake-selfhelp">
      <div class="aiux-card-body gap-3 p-4">
        <h3 id="intake-selfhelp" class="font-semibold">
          ${selfHelp.title || i18n.getMessage('Try this first')}
        </h3>
        <ol class="list-decimal flex flex-col gap-1 ps-5 text-sm">
          ${selfHelp.steps.map(step => html`<li class="break-words">${step}</li>`)}
        </ol>
        ${selfHelp.articles.length
          ? html`<div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="text-text-secondary">${i18n.getMessage('From:')}</span>
              ${selfHelp.articles.map(
                article => html`<button
                  type="button"
                  class="aiux-btn aiux-btn-xs aiux-btn-ghost h-auto min-h-6 whitespace-normal text-start"
                  @click=${() => navigate(`/knowledge/${article.sysId}`)}
                >
                  ${article.number} ${article.title}
                </button>`
              )}
            </div>`
          : nothing}
        ${this._stage === 'help'
          ? html`<div class="flex flex-wrap gap-2">
              <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-success" @click=${() => (this._stage = 'fixed')}>
                ${i18n.getMessage('That fixed it')}
              </button>
              <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => (this._stage = 'escalate')}>
                ${i18n.getMessage('I still need help')}
              </button>
            </div>`
          : nothing}
      </div>
    </section>`;
  }

  _renderIncidentDraft(recommendation) {
    if (this._created) {
      return html`<div class="aiux-alert aiux-alert-success aiux-alert-soft text-sm" role="status">
        <span>${i18n.getMessage('Incident {0} raised. The service desk will be in touch.', this._created.number)}</span>
        <button type="button" class="aiux-btn aiux-btn-sm" @click=${() => navigate(`/requests/${this._created.sys_id}`)}>
          ${i18n.getMessage('Open')}
        </button>
      </div>`;
    }
    const draft = this._draft;
    return html`<form class="aiux-card border border-base-300 bg-base-100" aria-labelledby="intake-draft" @submit=${this._raiseIncident}>
      <div class="aiux-card-body gap-3 p-4">
        <h3 id="intake-draft" class="font-semibold">${i18n.getMessage('Report it: review your incident')}</h3>
        ${recommendation.reason ? html`<p class="text-sm text-text-secondary">${recommendation.reason}</p>` : nothing}
        <label class="aiux-fieldset">
          <span class="aiux-fieldset-legend text-sm">${i18n.getMessage('Summary')}</span>
          <input
            class="aiux-input w-full"
            maxlength="160"
            required
            .value=${draft.shortDescription}
            @input=${e => this._onDraftInput('shortDescription', e)}
          />
        </label>
        <label class="aiux-fieldset">
          <span class="aiux-fieldset-legend text-sm">${i18n.getMessage('Details')}</span>
          <textarea
            class="aiux-textarea w-full"
            rows="5"
            .value=${draft.description}
            @input=${e => this._onDraftInput('description', e)}
          ></textarea>
        </label>
        <label class="aiux-fieldset">
          <span class="aiux-fieldset-legend text-sm">${i18n.getMessage('How much does it affect you?')}</span>
          <select class="aiux-select w-full" @change=${e => this._onDraftInput('urgency', e)}>
            ${urgencies().map(
              option => html`<option value=${option.value} ?selected=${option.value === draft.urgency}>${option.label}</option>`
            )}
          </select>
        </label>
        <div class="flex flex-wrap justify-end gap-2">
          <button type="submit" class="aiux-btn aiux-btn-primary" ?disabled=${this._creating || !draft.shortDescription.trim()}>
            ${this._creating ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
            ${i18n.getMessage('Raise incident')}
          </button>
        </div>
      </div>
    </form>`;
  }

  _renderCatalog(recommendation) {
    return html`<section class="aiux-card border border-base-300 bg-base-100" aria-labelledby="intake-catalog">
      <div class="aiux-card-body gap-3 p-4">
        <h3 id="intake-catalog" class="font-semibold">
          ${i18n.getMessage('Request it: {0}', recommendation.catalogItem.name)}
        </h3>
        ${recommendation.reason ? html`<p class="text-sm text-text-secondary">${recommendation.reason}</p>` : nothing}
        <button type="button" class="aiux-btn aiux-btn-primary self-end" @click=${() => this._openCatalogItem(recommendation)}>
          ${i18n.getMessage('Open the pre-filled form')}
        </button>
      </div>
    </section>`;
  }

  _renderResult(run) {
    if (run.state === 'failed' || !run.briefing) {
      return html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">
        ${i18n.getMessage('The assistant could not finish. Try again, or describe the problem differently.')}
      </div>`;
    }
    const {summary, selfHelp, recommendation} = run.briefing;
    const escalating = this._stage === 'escalate';
    return html`<p class="max-w-full break-words font-medium">${summary}</p>
      ${selfHelp ? this._renderSelfHelp(selfHelp) : nothing}
      ${this._stage === 'fixed'
        ? html`<div class="aiux-alert aiux-alert-success aiux-alert-soft text-sm" role="status">
            ${i18n.getMessage('Great, glad that sorted it. No ticket needed.')}
          </div>`
        : nothing}
      ${escalating && recommendation.type === 'incident' && this._draft ? this._renderIncidentDraft(recommendation) : nothing}
      ${escalating && recommendation.type === 'catalog' ? this._renderCatalog(recommendation) : nothing}
      ${escalating && recommendation.type === 'none'
        ? html`<p class="text-sm text-text-secondary">
            ${i18n.getMessage('Still stuck? Describe what happened when you tried, and the assistant will draft a ticket.')}
          </p>`
        : nothing}`;
  }

  render() {
    const run = this._run;
    const running = run?.state === 'running';
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="intake-title">
      <div class="aiux-card-body gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <h2 id="intake-title" class="aiux-card-title text-xl">${i18n.getMessage('Fix it or report it')}</h2>
            <p class="text-sm text-text-secondary">
              ${run
                ? i18n.getMessage('You said: {0}', run.prompt)
                : i18n.getMessage('Tell us what is wrong. An AI agent checks the knowledge base and similar fixed issues, then drafts the ticket if you still need one.')}
            </p>
          </div>
          ${run && !running
            ? html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._reset}>
                ${i18n.getMessage('Start over')}
              </button>`
            : nothing}
        </div>
        <div role="status" aria-live="polite" class="flex flex-col gap-4">
          ${this._error ? html`<div class="aiux-alert aiux-alert-warning aiux-alert-soft text-sm">${this._error}</div>` : nothing}
          ${run && (running || !run.briefing)
            ? html`<luxesc-agent-steps .steps=${run.steps || []} ?running=${running}></luxesc-agent-steps>`
            : nothing}
          ${run && !running ? this._renderResult(run) : nothing}
        </div>
        ${run ? nothing : this._renderForm()}
      </div>
    </section>`;
  }
}
