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
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchCategories, fetchItems} from '../../utils/api.js';
import {ITEMS_PAGE_SIZE, SERVICE_CATALOG_ID} from '../../constants/catalog.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import '../../components/luxesc-item-gallery.js';
import {catalogTools} from '../../utils/catalog-tools.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-catalog');

function itemsPage({categoryId, text, offset}) {
  return fetchItems({
    catalogId: SERVICE_CATALOG_ID,
    categoryId,
    text,
    // One extra row tells us whether another page exists
    limit: ITEMS_PAGE_SIZE + 1,
    offset
  });
}

@customElement('x-everi-luxesc-catalog-page')
@title('Request something')
@acl([{roles: ['snc_internal']}])
export default class CatalogPage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'The service catalog: categories, a search box and the matching items',
    bestFor:
      'When the employee needs something (hardware, software, access, a service) and you have to find the right catalog item'
  };

  static client_tools = {
    ...catalogTools,
    show_catalog_results: {
      description: 'Show the catalog items matching a search on this page.',
      arguments: [
        {name: 'text', description: 'What the employee needs, in a few keywords', type: 'string', required: true}
      ],
      definition: async function ({text} = {}) {
        navigate('/catalog', {query: {q: String(text || '')}});
        return {success: true};
      }
    }
  };

  @state() _items = [];
  @state() _hasMore = false;
  @state() _loadingMore = false;
  @state() _error = '';

  _prevLoaderData = null;

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const text = ctx.query?.q || '';
    const categoryId = ctx.query?.category || '';
    const [categories, items] = await Promise.allSettled([
      fetchCategories(SERVICE_CATALOG_ID),
      itemsPage({categoryId, text, offset: 0})
    ]);
    if (items.status === 'rejected') {
      log.error({error: items.reason?.message}, 'Failed to load catalog items');
    }
    return {
      text,
      categoryId,
      categories: categories.status === 'fulfilled' ? categories.value || [] : [],
      items: items.status === 'fulfilled' ? items.value || [] : null
    };
  }

  willUpdate() {
    if (this.loaderData !== this._prevLoaderData) {
      this._prevLoaderData = this.loaderData;
      const items = this.loaderData?.items;
      this._error = items === null
        ? i18n.getMessage('The catalog could not be loaded. Try again later.')
        : '';
      this._items = (items || []).slice(0, ITEMS_PAGE_SIZE);
      this._hasMore = (items || []).length > ITEMS_PAGE_SIZE;
    }
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Request something'));
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    const loaderChanged = this.loaderData !== this._contextData;
    if (isServer || !(changed.has('_items') || loaderChanged)) return;
    this._contextData = this.loaderData;
    const {text, categoryId, categories = []} = this.loaderData || {};
    this.setAiContext({
      search: text || '',
      category: categories.find(category => category.sys_id === categoryId)?.title || '',
      items: this._items.map(item => ({sysId: item.sys_id, name: item.name}))
    });
  }

  _filter(query) {
    navigate('/catalog', {query});
  }

  _search(e) {
    e.preventDefault();
    const text = new FormData(e.target).get('q')?.toString().trim();
    const {categoryId} = this.loaderData || {};
    this._filter({
      ...(text && {q: text}),
      ...(categoryId && {category: categoryId})
    });
  }

  _selectCategory(e) {
    const categoryId = e.currentTarget.dataset.category;
    const {text} = this.loaderData || {};
    this._filter({
      ...(text && {q: text}),
      ...(categoryId && {category: categoryId})
    });
  }

  async _loadMore() {
    if (this._loadingMore) return;
    const {categoryId, text} = this.loaderData || {};
    try {
      this._loadingMore = true;
      const page = await itemsPage({categoryId, text, offset: this._items.length});
      this._items = [...this._items, ...page.slice(0, ITEMS_PAGE_SIZE)];
      this._hasMore = page.length > ITEMS_PAGE_SIZE;
    } catch (error) {
      log.error({error: error.message}, 'Failed to load more items');
      this._error = i18n.getMessage('More items could not be loaded. Try again.');
    } finally {
      this._loadingMore = false;
    }
  }

  _renderCategories(categories, activeId) {
    const options = [
      {sys_id: '', title: i18n.getMessage('All categories')},
      ...categories
    ];
    return html`<nav aria-label=${i18n.getMessage('Categories')}>
      <ul class="aiux-menu w-full gap-1 rounded-box bg-base-100 p-2 shadow-sm">
        ${options.map(
          category => html`<li>
            <button
              type="button"
              data-category=${category.sys_id}
              aria-current=${category.sys_id === activeId ? 'page' : 'false'}
              class=${classMap({'aiux-menu-active': category.sys_id === activeId})}
              @click=${this._selectCategory}
            >
              <span class="max-w-full break-words text-start">${category.title}</span>
            </button>
          </li>`
        )}
      </ul>
    </nav>`;
  }

  _renderResults() {
    const {text} = this.loaderData || {};
    if (!this._items.length && !this._error) {
      return html`<aiux-empty-state-content
        heading=${text
          ? i18n.getMessage('No results for "{0}"', text)
          : i18n.getMessage('No items in this category')}
        body=${i18n.getMessage('Try another search or category.')}
      ></aiux-empty-state-content>`;
    }
    return html`<luxesc-item-gallery .items=${this._items}></luxesc-item-gallery>
      ${this._hasMore
        ? html`<div class="flex justify-center">
            <button
              type="button"
              class="aiux-btn aiux-btn-outline"
              ?disabled=${this._loadingMore}
              @click=${this._loadMore}
            >
              ${this._loadingMore
                ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
                : nothing}
              ${i18n.getMessage('Show more')}
            </button>
          </div>`
        : nothing}`;
  }

  render() {
    const {categories = [], categoryId = '', text = ''} = this.loaderData || {};
    const active = categories.find(category => category.sys_id === categoryId);
    return html`<div class="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:p-8">
      <header class="flex flex-col gap-4">
        <h1 class="text-2xl font-bold">${i18n.getMessage('Request something')}</h1>
        <form
          role="search"
          aria-label=${i18n.getMessage('Search the catalog')}
          class="flex w-full max-w-2xl gap-2" @submit=${this._search}>
          <label class="aiux-input w-full">
            <span class="sr-only">${i18n.getMessage('Search the catalog')}</span>
            <input
              type="search"
              name="q"
              .value=${text}
              placeholder=${i18n.getMessage('Search the catalog')}
            />
          </label>
          <button type="submit" class="aiux-btn aiux-btn-primary">
            ${i18n.getMessage('Search')}
          </button>
        </form>
      </header>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
        ${this._renderCategories(categories, categoryId)}
        <section class="flex min-w-0 flex-col gap-4" aria-labelledby="results-title">
          <h2 id="results-title" class="text-lg font-semibold">
            ${active?.title || i18n.getMessage('All categories')}
          </h2>
          ${active?.description
            ? html`<p class="max-w-full break-words text-sm text-text-secondary">
                ${active.description}
              </p>`
            : nothing}
          ${this._error
            ? html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
                ${this._error}
              </div>`
            : nothing}
          <div role="status" aria-live="polite" class="flex flex-col gap-4">
            ${this._renderResults()}
          </div>
        </section>
      </div>
    </div>`;
  }
}
