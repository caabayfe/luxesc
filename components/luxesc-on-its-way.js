import {html, css, isServer} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {fetchRecords} from '../utils/api.js';

const log = getLogger('luxesc-on-its-way');

const LIMIT = 5;
const DAY_MS = 86400000;
const FIELDS = 'sys_id,number,cat_item,short_description,stage,due_date';
const OPEN_ITEMS =
  'active=true^opened_by=javascript:gs.getUserID()^ORrequested_for=javascript:gs.getUserID()^ORDERBYdue_date';

const stepLabels = () => [
  i18n.getMessage('Approval'),
  i18n.getMessage('Fulfillment'),
  i18n.getMessage('Delivery'),
  i18n.getMessage('Done')
];

// The requested item's stage (workflow stages vary per catalog item) mapped onto four steps
function stepOf(stage) {
  if (/approv/.test(stage)) return 0;
  if (/deliver/.test(stage)) return 2;
  if (/complete|closed/.test(stage)) return 3;
  return 1;
}

// Glide date-times come in UTC as "YYYY-MM-DD HH:mm:ss"
const parseUtc = value => (value ? Date.parse(`${value.replace(' ', 'T')}Z`) : NaN);

/**
 * "On its way": the employee's open catalog requests with a four-step tracker
 * (Approval, Fulfillment, Delivery, Done) from the item's stage, and the due
 * date, said plainly when it has passed. Reads the records only; no AI.
 */
@customElement('luxesc-on-its-way')
export class OnItsWay extends AIUXElement {
  @property({type: String}) basePath = '';

  @state() _items = null;
  @state() _error = false;
  // When the items were read; "late" is measured against it
  _loadedAt = 0;

  static styles = css`
    :host {
      display: block;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (!isServer) this._load();
  }

  async _load() {
    try {
      this._loadedAt = Date.now();
      this._items = (await fetchRecords('sc_req_item', {encodedQuery: OPEN_ITEMS, fields: FIELDS, limit: LIMIT})) || [];
    } catch (error) {
      log.warn({error: error.message}, 'Requests unavailable');
      this._error = true;
    }
  }

  _renderWhen(item) {
    const due = parseUtc(item.due_date.value);
    if (Number.isNaN(due)) return html`<span class="text-sm text-text-secondary">${i18n.getMessage('No date yet')}</span>`;
    const late = Math.floor((this._loadedAt - due) / DAY_MS);
    return late >= 1
      ? html`<span class="aiux-badge aiux-badge-warning aiux-badge-soft">${i18n.getMessage('{0} days late', late)}</span>`
      : html`<span class="text-sm text-text-secondary">${i18n.getMessage('Due {0}', item.due_date.display_value.split(' ')[0])}</span>`;
  }

  _renderItem(item) {
    const current = stepOf(item.stage.value || '');
    const labels = stepLabels();
    const name = item.cat_item.display_value || item.short_description.display_value;
    return html`<li class="flex flex-col gap-3 py-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <a class="aiux-link aiux-link-hover min-w-0 truncate font-medium" href="${this.basePath}/requests/${item.sys_id.value}" title=${name}>
          ${name}
        </a>
        <div class="flex shrink-0 items-center gap-2">
          <span class="text-sm text-text-secondary">${item.number.display_value}</span>
          ${this._renderWhen(item)}
        </div>
      </div>
      <ul class="aiux-steps w-full" aria-label=${i18n.getMessage('{0}: {1}', name, labels[current])}>
        ${labels.map(
          (label, index) => html`<li
            class="aiux-step ${index <= current ? 'aiux-step-primary' : ''}"
            data-content=${index < current ? '✓' : String(index + 1)}
            aria-current=${index === current ? 'step' : 'false'}
          >
            ${label}
          </li>`
        )}
      </ul>
    </li>`;
  }

  render() {
    const items = this._items;
    return html`<section class="aiux-card h-full border border-base-300 bg-base-100 shadow-sm" aria-labelledby="on-its-way-title">
      <div class="aiux-card-body gap-1">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="on-its-way-title" class="aiux-card-title text-lg">
            ${items?.length ? i18n.getMessage('On its way · {0}', items.length) : i18n.getMessage('On its way')}
          </h2>
          <a class="aiux-link aiux-link-primary text-sm" href="${this.basePath}/requests">${i18n.getMessage('View all requests')}</a>
        </div>
        ${this._error
          ? html`<p class="text-sm text-text-secondary">${i18n.getMessage('Your requests could not be loaded.')}</p>`
          : items === null
            ? html`<div class="flex flex-col gap-3 py-2" aria-hidden="true">
                <div class="aiux-skeleton h-5 w-1/2"></div>
                <div class="aiux-skeleton h-8 w-full"></div>
              </div>`
            : items.length
              ? html`<ul class="flex flex-col divide-y divide-base-300">${items.map(item => this._renderItem(item))}</ul>`
              : html`<p class="py-2 text-sm text-text-secondary">${i18n.getMessage('Nothing on its way. Ask for something above.')}</p>`}
      </div>
    </section>`;
  }
}
