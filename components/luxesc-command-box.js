import {html, css, nothing, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import {fetchItems, fetchRecords} from '../utils/api.js';
import {SERVICE_CATALOG_ID} from '../constants/catalog.js';
import {isChatEnabled} from '../utils/chat.js';
import {askAssistant} from './luxesc-ask.js';
import './luxesc-intake.js';
import './luxesc-planner.js';

const log = getLogger('luxesc-command-box');

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const PER_GROUP = 3;
// Longer text is a description for the agents; matching its every word only finds noise
const MAX_SEARCH_WORDS = 4;
const PUBLISHED = 'workflow_state=published^active=true';
const MINE = 'active=true^opened_by=javascript:gs.getUserID()^sys_class_nameINsc_req_item,incident';

// Encoded queries cannot carry ^ or =; the words are only used for matching
const clean = text => text.replace(/[\^=]/g, ' ').trim();

/**
 * The portal's one box: "What do you need?". While the employee types it shows
 * matching answers, services and their own tickets (plain Table and Catalog API
 * searches, no AI). Enter hands the sentence to the intake agent (self-help,
 * known issue, drafted ticket or catalog item); "Plan several items" hands it to
 * the planner; "Ask the assistant" opens Now Assist. The agent's answer opens
 * in place, under the box.
 */
@customElement('luxesc-command-box')
export class CommandBox extends AIUXElement {
  @property({type: String}) basePath = '';
  @property({type: Array}) suggestions = [];
  // Inside the command palette: no card or heading of its own, the input takes focus
  @property({type: Boolean}) bare = false;

  @state() _text = '';
  @state() _results = null;
  // '' while typing; 'help' or 'plan' once an agent works on the text
  @state() _mode = '';

  _timer = null;
  _searchId = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  _onInput(e) {
    this._text = e.target.value;
    clearTimeout(this._timer);
    const text = clean(this._text);
    if (text.length < MIN_CHARS || text.split(/\s+/).length > MAX_SEARCH_WORDS) {
      this._results = null;
      return;
    }
    this._timer = setTimeout(() => this._search(text), DEBOUNCE_MS);
  }

  async _search(text) {
    const id = ++this._searchId;
    const [answers, services, yours] = await Promise.allSettled([
      fetchRecords('kb_knowledge', {
        encodedQuery: `${PUBLISHED}^123TEXTQUERY321=${text}`,
        fields: 'sys_id,number,short_description',
        limit: PER_GROUP
      }),
      fetchItems({catalogId: SERVICE_CATALOG_ID, text, limit: PER_GROUP}),
      fetchRecords('task', {
        encodedQuery: `${MINE}^short_descriptionLIKE${text}^ORnumberLIKE${text}^ORDERBYDESCsys_updated_on`,
        fields: 'sys_id,number,short_description',
        limit: PER_GROUP
      })
    ]);
    // A slower, older search must not replace the results of a newer one
    if (id !== this._searchId) return;
    [answers, services, yours].filter(r => r.status === 'rejected').forEach(r => log.warn({error: r.reason?.message}, 'Search failed'));
    const value = r => (r.status === 'fulfilled' ? r.value || [] : []);
    this._results = {answers: value(answers), services: value(services), yours: value(yours)};
  }

  async _run(mode) {
    const text = this._text.trim();
    if (!text || isServer) return;
    clearTimeout(this._timer);
    this._searchId++;
    this._results = null;
    this._mode = mode;
    await this.updateComplete;
    const agent = this.renderRoot.querySelector(mode === 'plan' ? 'luxesc-planner' : 'luxesc-intake');
    if (mode === 'plan') agent?.plan(text);
    else agent?.help(text);
  }

  _onSubmit(e) {
    e.preventDefault();
    this._run('help');
  }

  _clear() {
    clearTimeout(this._timer);
    this._searchId++;
    Object.assign(this, {_text: '', _results: null, _mode: ''});
    this.updateComplete.then(() => this.renderRoot.querySelector('input')?.focus());
  }

  _useSuggestion(text) {
    this._text = text;
    this._run('help');
  }

  _renderGroup(label, rows) {
    if (!rows.length) return nothing;
    return html`<li class="flex flex-col gap-1">
      <span class="px-3 text-xs font-semibold text-text-secondary">${label}</span>
      <ul class="flex flex-col">
        ${rows.map(
          row => html`<li>
            <a class="flex items-center justify-between gap-3 rounded-box px-3 py-2 hover:bg-base-200 focus-visible:bg-base-200" href=${row.href}>
              <span class="min-w-0 truncate" title=${row.title}>${row.title}</span>
              ${row.meta ? html`<span class="shrink-0 text-sm text-text-secondary">${row.meta}</span>` : nothing}
            </a>
          </li>`
        )}
      </ul>
    </li>`;
  }

  _renderResults() {
    const {answers, services, yours} = this._results;
    const base = this.basePath;
    return html`<ul class="flex flex-col gap-3 border-t border-base-300 pt-3" aria-label=${i18n.getMessage('Matches')}>
      ${this._renderGroup(
        i18n.getMessage('Answers'),
        answers.map(a => ({href: `${base}/knowledge/${a.sys_id.value}`, title: a.short_description.display_value, meta: a.number.display_value}))
      )}
      ${this._renderGroup(
        i18n.getMessage('Services'),
        services.map(s => ({href: `${base}/catalog/${s.sys_id}`, title: s.name, meta: s.show_price ? s.price : ''}))
      )}
      ${this._renderGroup(
        i18n.getMessage('Yours'),
        yours.map(t => ({href: `${base}/requests/${t.sys_id.value}`, title: t.short_description.display_value, meta: t.number.display_value}))
      )}
      ${answers.length || services.length || yours.length
        ? nothing
        : html`<li class="px-3 text-sm text-text-secondary">${i18n.getMessage('No direct matches. An agent can still look into it.')}</li>`}
    </ul>`;
  }

  _renderActions() {
    const ready = !!this._text.trim();
    return html`<div class="flex flex-wrap items-center gap-2">
      <button type="submit" class="aiux-btn aiux-btn-primary" ?disabled=${!ready}>
        ${icon({name: 'ai-sparkle', size: 'sm'})} ${i18n.getMessage('Let an agent handle it')}
      </button>
      <button type="button" class="aiux-btn aiux-btn-outline" ?disabled=${!ready} @click=${() => this._run('plan')}>
        ${i18n.getMessage('Plan several items')}
      </button>
      ${isChatEnabled()
        ? html`<button type="button" class="aiux-btn aiux-btn-ghost" ?disabled=${!ready} @click=${() => askAssistant(this, this._text.trim())}>
            ${i18n.getMessage('Ask the assistant')}
          </button>`
        : nothing}
    </div>`;
  }

  _renderAgent() {
    return html`<div class="flex flex-col gap-3 border-t border-base-300 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="min-w-0 break-words text-sm text-text-secondary">${i18n.getMessage('You said: {0}', this._text)}</p>
        <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._clear}>${i18n.getMessage('Start over')}</button>
      </div>
      ${this._mode === 'plan' ? html`<luxesc-planner embedded></luxesc-planner>` : html`<luxesc-intake embedded></luxesc-intake>`}
    </div>`;
  }

  focus() {
    this.updateComplete.then(() => this.renderRoot.querySelector('input')?.focus());
  }

  _renderContent() {
    return this._mode
      ? this._renderAgent()
      : html`<form class="flex flex-col gap-3" role="search" aria-labelledby="command-title" @submit=${this._onSubmit}>
          <label class="aiux-input aiux-input-lg w-full">
            ${icon({name: 'magnifying-glass', size: 'sm'})}
            <span class="sr-only">${i18n.getMessage('What do you need?')}</span>
            <input
              type="search"
              autocomplete="off"
              .value=${this._text}
              placeholder=${i18n.getMessage('Describe a problem, ask for something, or ask a question')}
              @input=${this._onInput}
            />
          </label>
          ${this._results ? this._renderResults() : nothing}
          ${this._text.trim()
            ? this._renderActions()
            : html`<div class="flex flex-wrap gap-2">
                ${this.suggestions.map(
                  s => html`<button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => this._useSuggestion(s.question)}>
                    ${s.label}
                  </button>`
                )}
              </div>`}
        </form>`;
  }

  render() {
    if (this.bare) {
      return html`<div class="flex flex-col gap-4">
        <h2 id="command-title" class="sr-only">${i18n.getMessage('What do you need?')}</h2>
        ${this._renderContent()}
      </div>`;
    }
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="command-title">
      <div class="aiux-card-body gap-4">
        <h2 id="command-title" class="text-xl font-semibold">${i18n.getMessage('What do you need?')}</h2>
        ${this._renderContent()}
      </div>
    </section>`;
  }
}
