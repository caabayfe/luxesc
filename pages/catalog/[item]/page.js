import {html, css, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {triggerTransientToast} from '@servicenow/aiux/aiux-components-toast';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {
  fetchItem,
  fetchRecords,
  imageUrl,
  orderNow,
  submitProducer
} from '../../../utils/api.js';
import {
  collectFields,
  missingMandatory,
  toBlocks,
  toSubmission
} from '../../../utils/variables.js';
import {RECORD_PRODUCER_CLASS} from '../../../constants/catalog.js';
import {setDocumentTitle} from '../../../utils/document-title.js';
import './components/luxesc-variable-form.js';
import '../../../components/luxesc-rich-text.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-catalog-item');

const MAX_QUANTITY = 10;

@customElement('x-everi-luxesc-catalog-item-page')
@title('Catalog item')
@acl([{roles: ['snc_internal']}])
export default class CatalogItemPage extends AIUXElement {
  @state() _values = {};
  @state() _displayValues = {};
  @state() _invalid = [];
  @state() _quantity = 1;
  @state() _submitting = false;
  @state() _error = '';

  _prevLoaderData = null;
  _blocks = [];
  _fields = [];

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const itemId = ctx.params.item;
    try {
      return {basePath: ctx.basePath || '', item: await fetchItem(itemId)};
    } catch (error) {
      log.error({error: error.message, itemId}, 'Failed to load catalog item');
      return {basePath: ctx.basePath || '', item: null};
    }
  }

  willUpdate() {
    if (this.loaderData !== this._prevLoaderData) {
      this._prevLoaderData = this.loaderData;
      this._blocks = toBlocks(this.loaderData?.item?.variables || []);
      this._fields = collectFields(this._blocks);
      this._values = Object.fromEntries(
        this._fields.map(field => [field.name, field.value])
      );
      this._displayValues = {};
      this._invalid = [];
      this._quantity = 1;
      this._error = '';
    }
  }

  firstUpdated() {
    setDocumentTitle(
      this.loaderData?.item?.name || i18n.getMessage('Catalog item')
    );
  }

  get _isProducer() {
    return this.loaderData?.item?.sys_class_name === RECORD_PRODUCER_CLASS;
  }

  _onValueChanged(e) {
    const {name, value, displayValue} = e.detail;
    this._values = {...this._values, [name]: value};
    if (displayValue !== undefined) {
      this._displayValues = {...this._displayValues, [name]: displayValue};
    }
    if (this._invalid.includes(name)) {
      this._invalid = this._invalid.filter(invalid => invalid !== name);
    }
  }

  _onQuantity(e) {
    this._quantity = Number(e.target.value) || 1;
  }

  // The order lands on a request; the employee tracks the requested item
  async _requestedItemFor(requestId) {
    const items = await fetchRecords('sc_req_item', {
      encodedQuery: `request=${requestId}`,
      fields: 'sys_id',
      limit: 1
    }).catch(() => []);
    return items?.[0]?.sys_id?.value || requestId;
  }

  async _submit(e) {
    e.preventDefault();
    if (this._submitting) return;

    const missing = missingMandatory(this._fields, this._values);
    if (missing.length) {
      this._invalid = missing.map(field => field.name);
      this._error = i18n.getMessage(
        'Fill in the required fields: {0}',
        missing.map(field => field.label).join(', ')
      );
      return;
    }

    const item = this.loaderData.item;
    const variables = toSubmission(this._fields, this._values);
    try {
      this._submitting = true;
      this._error = '';
      let target;
      if (this._isProducer) {
        const result = await submitProducer(item.sys_id, {variables});
        target = result?.sys_id;
        triggerTransientToast(
          i18n.getMessage('{0} submitted', result?.number || item.name)
        );
      } else {
        const result = await orderNow(item.sys_id, {
          quantity: this._quantity,
          variables
        });
        target = await this._requestedItemFor(result?.request_id || result?.sys_id);
        triggerTransientToast(
          i18n.getMessage('Request {0} submitted', result?.request_number || result?.number || '')
        );
      }
      navigate(target ? `/requests/${target}` : '/requests');
    } catch (error) {
      log.error({error: error.message, itemId: item.sys_id}, 'Order failed');
      this._error = i18n.getMessage(
        'Your request could not be submitted. Check the form and try again.'
      );
    } finally {
      this._submitting = false;
    }
  }

  _renderHeader(item) {
    const basePath = this.loaderData?.basePath || '';
    return html`<header class="flex flex-col gap-4">
      <nav class="aiux-breadcrumbs text-sm" aria-label=${i18n.getMessage('Breadcrumb')}>
        <ul>
          <li><a href="${basePath}/home">${i18n.getMessage('Home')}</a></li>
          <li><a href="${basePath}/catalog">${i18n.getMessage('Request something')}</a></li>
          ${item.category?.title
            ? html`<li>
                <a href="${basePath}/catalog?category=${item.category.sys_id}">
                  ${item.category.title}
                </a>
              </li>`
            : nothing}
        </ul>
      </nav>
      <div class="flex items-start gap-4">
        ${item.picture
          ? html`<img
              src=${imageUrl(item.picture)}
              alt=""
              width="64"
              height="64"
              class="h-16 w-16 shrink-0 rounded-box bg-base-100 object-contain p-1 shadow-sm"
            />`
          : nothing}
        <div class="flex min-w-0 flex-col gap-1">
          <h1 class="max-w-full break-words text-2xl font-bold">${item.name}</h1>
          ${item.short_description
            ? html`<p class="max-w-full break-words text-text-secondary">
                ${item.short_description}
              </p>`
            : nothing}
        </div>
      </div>
    </header>`;
  }

  _renderOrderPanel(item) {
    const actionLabel = this._isProducer
      ? i18n.getMessage('Submit')
      : i18n.getMessage('Request');
    return html`<aside
      class="aiux-card h-fit bg-base-100 shadow-sm lg:sticky lg:top-4"
      aria-labelledby="order-title"
    >
      <div class="aiux-card-body gap-4">
        <h2 id="order-title" class="aiux-card-title text-base">
          ${i18n.getMessage('Order summary')}
        </h2>
        ${item.show_price && item.price
          ? html`<dl class="flex justify-between text-sm">
              <dt class="text-text-secondary">${i18n.getMessage('Price')}</dt>
              <dd class="font-semibold">${item.price}</dd>
            </dl>`
          : nothing}
        ${item.show_quantity && !this._isProducer
          ? html`<label class="aiux-fieldset">
              <span class="aiux-fieldset-legend text-sm">${i18n.getMessage('Quantity')}</span>
              <select
                class="aiux-select w-full"
                .value=${String(this._quantity)}
                ?disabled=${this._submitting}
                @change=${this._onQuantity}
              >
                ${Array.from({length: MAX_QUANTITY}, (_, i) => i + 1).map(
                  quantity => html`<option value=${quantity}>${quantity}</option>`
                )}
              </select>
            </label>`
          : nothing}
        <button
          type="submit"
          form="order-form"
          class="aiux-btn aiux-btn-primary w-full"
          ?disabled=${this._submitting}
        >
          ${this._submitting
            ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
            : nothing}
          ${actionLabel}
        </button>
      </div>
    </aside>`;
  }

  render() {
    const item = this.loaderData?.item;
    if (!item) {
      return html`<div class="mx-auto max-w-3xl p-4 lg:p-8">
        <aiux-empty-state-content
          heading=${i18n.getMessage('This item is not available')}
          body=${i18n.getMessage('It may have been retired, or it is not offered to you.')}
        ></aiux-empty-state-content>
      </div>`;
    }

    return html`<div class="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:p-8">
      ${this._renderHeader(item)}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <form
          id="order-form"
          class="flex min-w-0 flex-col gap-6"
          novalidate
          aria-labelledby="details-title"
          @submit=${this._submit}
        >
          ${item.description
            ? html`<section class="aiux-card bg-base-100 shadow-sm">
                <div class="aiux-card-body max-w-full break-words text-sm">
                  <luxesc-rich-text
                    name="description"
                    label=${i18n.getMessage('Description')}
                    .value=${item.description}
                  ></luxesc-rich-text>
                </div>
              </section>`
            : nothing}
          <div role="alert">
            ${this._error
              ? html`<div class="aiux-alert aiux-alert-error aiux-alert-soft">${this._error}</div>`
              : nothing}
          </div>
          ${this._blocks.length
            ? html`<section class="aiux-card bg-base-100 shadow-sm" aria-labelledby="details-title">
                <div class="aiux-card-body gap-4">
                  <h2 id="details-title" class="aiux-card-title text-base">
                    ${i18n.getMessage('Details')}
                  </h2>
                  <luxesc-variable-form
                    .blocks=${this._blocks}
                    .values=${this._values}
                    .displayValues=${this._displayValues}
                    .invalid=${this._invalid}
                    .disabled=${this._submitting}
                    @luxesc-variable-form:value-changed=${this._onValueChanged}
                  ></luxesc-variable-form>
                </div>
              </section>`
            : nothing}
        </form>
        ${this._renderOrderPanel(item)}
      </div>
    </div>`;
  }
}
