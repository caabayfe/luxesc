import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  userContext,
  withWidgetContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchCategories, fetchItems, fetchRecords} from '../../utils/api.js';
import {SERVICE_CATALOG_ID} from '../../constants/catalog.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import {chatContext, isChatEnabled} from '../../utils/chat.js';
import '../../components/luxesc-item-gallery.js';
import '../../components/luxesc-ask.js';
import '../../components/luxesc-concierge.js';
import '../../components/luxesc-intake.js';
import '../../components/luxesc-known-issues.js';
import {catalogTools} from '../../utils/catalog-tools.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-home');

const FEATURED_COUNT = 6;
// Categories listed next to the intake; the rest are one click away in the catalog
const CATEGORY_COUNT = 8;
const REQUEST_FIELDS = 'sys_id,number,short_description,state,sys_class_name,sys_updated_on';
const MY_OPEN_REQUESTS =
  'active=true^opened_by=javascript:gs.getUserID()^sys_class_nameINsc_req_item,incident^ORDERBYDESCsys_updated_on';

@customElement('x-everi-luxesc-home-page')
@title('Home')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class HomePage extends withWidgetContext(AIUXElement) {
  static contexts = [userContext, chatContext];

  static aiContext = {
    description: "Employee Center home: the employee's open requests and incidents, catalog categories and featured services",
    bestFor:
      'When the employee asks what they have open, wants to follow up a request, or needs something new. To order, use find_catalog_items, describe_catalog_item and open_catalog_item: they open a pre-filled form for the employee to submit.'
  };

  static client_tools = {
    open_request: {
      description: 'Open one of the employee\'s requests or incidents by its number (e.g. RITM0010054, INC0026088).',
      arguments: [
        {name: 'number', description: 'Request or incident number', type: 'string', required: true}
      ],
      definition: async function ({number} = {}) {
        const found = (this.loaderData?.openRequests || []).find(
          request => request.number.display_value === String(number).trim().toUpperCase()
        );
        const sysId = found?.sys_id.value ||
          (await fetchRecords('task', {
            encodedQuery: `number=${String(number).trim()}^opened_by=javascript:gs.getUserID()`,
            fields: 'sys_id',
            limit: 1
          }).catch(() => []))?.[0]?.sys_id?.value;
        if (!sysId) return {success: false, reason: `${number} is not one of your requests`};
        navigate(`/requests/${sysId}`);
        return {success: true};
      }
    },
    ...catalogTools
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const [categories, items, openRequests] = await Promise.allSettled([
      fetchCategories(SERVICE_CATALOG_ID),
      fetchItems({catalogId: SERVICE_CATALOG_ID, limit: FEATURED_COUNT}),
      fetchRecords('task', {encodedQuery: MY_OPEN_REQUESTS, fields: REQUEST_FIELDS, limit: 10})
    ]);
    if (items.status === 'rejected') {
      log.error({error: items.reason?.message}, 'Failed to load featured items');
    }
    return {
      basePath: ctx.basePath || '',
      categories: categories.status === 'fulfilled' ? categories.value || [] : [],
      items: items.status === 'fulfilled' ? items.value || [] : null,
      openRequests: openRequests.status === 'fulfilled' ? openRequests.value || [] : []
    };
  }

  get _basePath() {
    return this.loaderData?.basePath || '';
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Home'));
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    if (isServer || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    this.setAiContext({
      openRequests: (this.loaderData?.openRequests || []).map(request => ({
        number: request.number.display_value,
        summary: request.short_description.display_value,
        type: request.sys_class_name.display_value,
        state: request.state.display_value,
        updated: request.sys_updated_on.display_value
      }))
    });
  }

  _search(e) {
    e.preventDefault();
    const text = new FormData(e.target).get('q')?.toString().trim();
    navigate('/catalog', {query: text ? {q: text} : {}});
  }


  // Landing on /start rather than /home: the shell treats /home as a page that
  // embeds its own chat, so the shared assistant would not open from here
  get _suggestions() {
    return [
      {label: i18n.getMessage('My laptop is slow'), question: i18n.getMessage('My laptop is very slow. Help me fix it or request what I need.')},
      {label: i18n.getMessage('I need software'), question: i18n.getMessage('I need new software installed. Help me find the right catalog item.')},
      {label: i18n.getMessage('Where are my requests?'), question: i18n.getMessage('What requests and incidents do I have open, and which need my attention?')},
      {label: i18n.getMessage('Something is broken'), question: i18n.getMessage('Something is not working and I need to report it.')}
    ];
  }

  _renderHero() {
    const firstName = userContext.get()?.firstName;
    return html`<section
      class="aiux-card bg-primary text-primary-content"
      aria-labelledby="hero-title"
    >
      <div class="aiux-card-body items-center gap-4 py-10 text-center">
        <h1 id="hero-title" class="max-w-full break-words text-3xl font-bold">
          ${firstName
            ? i18n.getMessage('How can we help, {0}?', firstName)
            : i18n.getMessage('How can we help?')}
        </h1>
        ${isChatEnabled()
          ? html`<luxesc-ask
              class="w-full max-w-2xl"
              inverse
              label=${i18n.getMessage('Ask the assistant')}
              placeholder=${i18n.getMessage('Tell us what you need, in your own words')}
              .suggestions=${this._suggestions}
            ></luxesc-ask>`
          : html`<form
            role="search"
            aria-label=${i18n.getMessage('Search the catalog')}
            class="flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
            @submit=${this._search}
          >
            <label class="aiux-input aiux-input-lg w-full text-text-primary">
              <span class="sr-only">${i18n.getMessage('Search the catalog')}</span>
              <input
                type="search"
                name="q"
                placeholder=${i18n.getMessage('Search for services, devices and help')}
              />
            </label>
            <button type="submit" class="aiux-btn aiux-btn-lg aiux-btn-secondary">
              ${i18n.getMessage('Search')}
            </button>
          </form>`}
      </div>
    </section>`;
  }

  _renderCategories(categories) {
    if (!categories.length) return nothing;
    return html`<section class="aiux-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="categories-title">
      <div class="aiux-card-body gap-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="categories-title" class="aiux-card-title text-xl">${i18n.getMessage('Browse by category')}</h2>
          <a class="aiux-link aiux-link-primary text-sm" href="${this._basePath}/catalog">
            ${i18n.getMessage('View the full catalog')}
          </a>
        </div>
        <ul class="grid grid-cols-1 gap-1 sm:grid-cols-2">
          ${categories.slice(0, CATEGORY_COUNT).map(
            category => html`<li class="min-w-0">
              <a
                class="aiux-btn aiux-btn-ghost aiux-btn-sm w-full justify-start truncate"
                href="${this._basePath}/catalog?category=${category.sys_id}"
                title=${category.title}
              >
                ${category.title}
              </a>
            </li>`
          )}
        </ul>
      </div>
    </section>`;
  }

  _renderFeatured(items) {
    return html`<section class="flex flex-col gap-3" aria-labelledby="featured-title">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="featured-title" class="text-xl font-semibold">
          ${i18n.getMessage('Featured services')}
        </h2>
        <a class="aiux-link aiux-link-primary text-sm" href="${this._basePath}/catalog">
          ${i18n.getMessage('View the full catalog')}
        </a>
      </div>
      ${items === null
        ? html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
            ${i18n.getMessage('The catalog could not be loaded. Try again later.')}
          </div>`
        : items.length
          ? html`<luxesc-item-gallery .items=${items}></luxesc-item-gallery>`
          : html`<aiux-empty-state-content
              heading=${i18n.getMessage('No services available')}
            ></aiux-empty-state-content>`}
    </section>`;
  }

  render() {
    const {categories = [], items = null} = this.loaderData || {};
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-8 p-4 lg:p-8">
      ${this._renderHero()}
      <luxesc-known-issues></luxesc-known-issues>
      <luxesc-concierge .basePath=${this._basePath}></luxesc-concierge>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <luxesc-intake></luxesc-intake>
        ${this._renderCategories(categories)}
      </div>
      ${this._renderFeatured(items)}
    </div>`;
  }
}
