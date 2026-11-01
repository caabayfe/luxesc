import {html, css, nothing} from 'lit';
import {customElement} from 'lit/decorators.js';
import {
  AIUXElement,
  decorators,
  getLogger,
  userContext
} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-carousel';
import '@servicenow/aiux/aiux-components-list';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchCategories, fetchItems, imageUrl} from '../../utils/api.js';
import {SERVICE_CATALOG_ID} from '../../constants/catalog.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import '../../components/luxesc-item-gallery.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-home');

const FEATURED_COUNT = 6;
const MY_OPEN_REQUESTS =
  'active=true^opened_by=javascript:gs.getUserID()^sys_class_nameINsc_req_item,incident^ORDERBYDESCsys_updated_on';

@customElement('x-everi-luxesc-home-page')
@title('Home')
@acl([{roles: ['snc_internal']}])
export default class HomePage extends AIUXElement {
  static contexts = [userContext];

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const [categories, items] = await Promise.allSettled([
      fetchCategories(SERVICE_CATALOG_ID),
      fetchItems({catalogId: SERVICE_CATALOG_ID, limit: FEATURED_COUNT})
    ]);
    if (items.status === 'rejected') {
      log.error({error: items.reason?.message}, 'Failed to load featured items');
    }
    return {
      basePath: ctx.basePath || '',
      categories: categories.status === 'fulfilled' ? categories.value || [] : [],
      items: items.status === 'fulfilled' ? items.value || [] : null
    };
  }

  get _basePath() {
    return this.loaderData?.basePath || '';
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Home'));
  }

  _search(e) {
    e.preventDefault();
    const text = new FormData(e.target).get('q')?.toString().trim();
    navigate('/catalog', {query: text ? {q: text} : {}});
  }

  _openRequest(e) {
    const sysId = e.detail?.referenceSysId || e.detail?.metadata?.listSysId;
    if (sysId) navigate(`/requests/${sysId}`);
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
        <form
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
        </form>
      </div>
    </section>`;
  }

  _renderCategory(category, index) {
    return html`<a
      slot="item-${index}"
      href="${this._basePath}/catalog?category=${category.sys_id}"
      class="aiux-card h-full w-72 max-w-full bg-base-100 shadow-sm hover:shadow-md motion-reduce:transition-none"
    >
      <div class="aiux-card-body gap-2">
        ${category.homepage_image || category.header_image
          ? html`<img
              src=${imageUrl(category.homepage_image || category.header_image)}
              alt=""
              width="48"
              height="48"
              loading="lazy"
              class="h-12 w-12 object-contain"
            />`
          : nothing}
        <h3 class="aiux-card-title max-w-full break-words text-base">
          ${category.title}
        </h3>
        <p class="line-clamp-2 max-w-full break-words text-sm text-text-secondary">
          ${category.description || ''}
        </p>
      </div>
    </a>`;
  }

  _renderCategories(categories) {
    if (!categories.length) return nothing;
    return html`<section class="flex flex-col gap-3" aria-labelledby="categories-title">
      <h2 id="categories-title" class="text-xl font-semibold">
        ${i18n.getMessage('Browse by category')}
      </h2>
      <aiux-carousel-slider
        label=${i18n.getMessage('Catalog categories')}
        alignment="start"
        .items=${categories.map(category => ({type: 'custom', alt: category.title}))}
        .showIndicators=${false}
      >
        ${categories.map((category, index) => this._renderCategory(category, index))}
      </aiux-carousel-slider>
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

  _renderMyRequests() {
    return html`<section class="flex flex-col gap-3" aria-labelledby="requests-title">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="requests-title" class="text-xl font-semibold">
          ${i18n.getMessage('My open requests')}
        </h2>
        <a class="aiux-link aiux-link-primary text-sm" href="${this._basePath}/requests">
          ${i18n.getMessage('View all requests')}
        </a>
      </div>
      <div class="aiux-card border border-base-300 bg-base-100">
        <aiux-list-connected
          table="task"
          columns="number,short_description,state,sys_updated_on"
          .query=${MY_OPEN_REQUESTS}
          .pageSize=${5}
          .listOptions=${{
            heading: i18n.getMessage('Recently updated'),
            selectionEnabled: false,
            selectAllEnabled: false,
            showCount: true,
            showConditionBuilderButton: false,
            showEditColumnsButton: false,
            showZingSearch: false,
            showCopyURLButton: false,
            showEditRowAction: false
          }}
          @aiux-list-connected:reference-link-clicked=${this._openRequest}
        ></aiux-list-connected>
      </div>
    </section>`;
  }

  render() {
    const {categories = [], items = null} = this.loaderData || {};
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-8 p-4 lg:p-8">
      ${this._renderHero()} ${this._renderCategories(categories)}
      ${this._renderFeatured(items)} ${this._renderMyRequests()}
    </div>`;
  }
}
