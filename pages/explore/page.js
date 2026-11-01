import {html, css, nothing, isServer} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement, decorators, getLogger, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import '@servicenow/aiux/aiux-components-empty-state-content';
import '@servicenow/aiux/aiux-components-tabs';
import {fetchCategories, fetchItems, fetchRecords} from '../../utils/api.js';
import {ITEMS_PAGE_SIZE, SERVICE_CATALOG_ID} from '../../constants/catalog.js';
import {setDocumentTitle} from '../../utils/document-title.js';
import {catalogTools} from '../../utils/catalog-tools.js';
import {exploreQuery} from '../../utils/explore.js';
import '../../components/luxesc-item-gallery.js';
import '../../components/luxesc-planner.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-explore');

const TABS = ['all', 'services', 'answers'];
// The All tab shows a taste of each; the others the full lists
const PREVIEW_ITEMS = 6;
const PREVIEW_ARTICLES = 6;
const ARTICLES_LIMIT = 20;
const ARTICLE_FIELDS = 'sys_id,number,short_description,kb_knowledge_base,kb_category,sys_view_count,sys_updated_on';
// The Table API applies the knowledge ACLs and user criteria, so only articles the employee may read come back
const PUBLISHED = 'workflow_state=published^active=true';

// Without a search the most read articles; with one, every word must match (platform text search)
function articlesQuery(text) {
  const words = text.replace(/[\^=]/g, ' ').trim();
  return words ? `${PUBLISHED}^123TEXTQUERY321=${words}` : `${PUBLISHED}^ORDERBYDESCsys_view_count`;
}

function itemsPage({categoryId, text, offset, limit}) {
  // One extra row tells us whether another page exists
  return fetchItems({catalogId: SERVICE_CATALOG_ID, categoryId, text, limit: limit + 1, offset});
}

/**
 * Explore: everything the employee can get or read, in one search. Tabs for
 * All, Services (catalog items, filtered by category) and Answers (knowledge
 * articles), and the Request Planner for several items at once. Replaces the
 * separate catalog and knowledge list pages, which now forward here.
 */
@customElement('x-everi-luxesc-explore-page')
@title('Explore')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class ExplorePage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'Explore: one search over the service catalog (things to request) and the knowledge base (answers to read)',
    bestFor:
      'When the employee needs something (hardware, software, access, a service), looks for a how-to or an answer, or needs several things at once (onboarding, a move, a new team)'
  };

  static client_tools = {
    ...catalogTools,
    show_catalog_results: {
      description: 'Show the catalog items matching a search on this page.',
      arguments: [{name: 'text', description: 'What the employee needs, in a few keywords', type: 'string', required: true}],
      definition: async function ({text} = {}) {
        navigate('/explore', {query: exploreQuery({text: String(text || '').trim(), tab: 'services'})});
        return {success: true};
      }
    },
    search_knowledge: {
      description: 'Search the knowledge base and show the matching articles on this page.',
      arguments: [{name: 'text', description: 'Words to search for', type: 'string', required: true}],
      definition: async function ({text} = {}) {
        navigate('/explore', {query: exploreQuery({text: String(text || '').trim(), tab: 'answers'})});
        return {success: true};
      }
    },
    // Several items at once go to the Request Planner agent, shown in the planner card on this page
    plan_request: {
      description:
        'Plan a request with several catalog items at once (for example onboarding new hires) with the Request Planner agent. The plan appears on this page for the employee to review and add to the cart; nothing is ordered.',
      arguments: [
        {name: 'description', description: 'Everything the employee needs, in their words: what, how many, for whom, where, by when', type: 'string', required: true}
      ],
      definition: async function ({description} = {}) {
        this._planning = true;
        await this.updateComplete;
        const run = await this.renderRoot.querySelector('luxesc-planner')?.plan(description);
        return run
          ? {success: true, nextStep: 'Tell the employee the planner is working and the plan will appear on this page.'}
          : {success: false, error: 'The planner could not start'};
      }
    }
  };

  // Items shown on the Services tab, grown by "Show more"
  @state() _items = [];
  @state() _hasMore = false;
  @state() _loadingMore = false;
  @state() _moreError = '';
  // The planner card is open
  @state() _planning = false;

  _prevLoaderData = null;

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
  `;

  static async loader(ctx) {
    const text = String(ctx.query?.q || '').trim();
    const tab = TABS.includes(ctx.query?.tab) ? ctx.query.tab : 'all';
    const categoryId = ctx.query?.category || '';
    const itemLimit = tab === 'services' ? ITEMS_PAGE_SIZE : PREVIEW_ITEMS;
    const [categories, items, articles] = await Promise.allSettled([
      fetchCategories(SERVICE_CATALOG_ID),
      tab === 'answers' ? Promise.resolve([]) : itemsPage({categoryId, text, offset: 0, limit: itemLimit}),
      tab === 'services'
        ? Promise.resolve([])
        : fetchRecords('kb_knowledge', {
            encodedQuery: articlesQuery(text),
            fields: ARTICLE_FIELDS,
            limit: tab === 'answers' ? ARTICLES_LIMIT : PREVIEW_ARTICLES
          })
    ]);
    [categories, items, articles]
      .filter(result => result.status === 'rejected')
      .forEach(result => log.error({error: result.reason?.message}, 'Explore data unavailable'));
    return {
      basePath: ctx.basePath || '',
      text,
      tab,
      categoryId,
      itemLimit,
      categories: categories.status === 'fulfilled' ? categories.value || [] : [],
      // null when it could not be loaded, so the page can say so
      items: items.status === 'fulfilled' ? items.value || [] : null,
      articles: articles.status === 'fulfilled' ? articles.value || [] : null
    };
  }

  willUpdate() {
    if (this.loaderData === this._prevLoaderData) return;
    this._prevLoaderData = this.loaderData;
    const {items, itemLimit = PREVIEW_ITEMS} = this.loaderData || {};
    this._items = (items || []).slice(0, itemLimit);
    this._hasMore = (items || []).length > itemLimit;
    this._moreError = '';
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Explore'));
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    const loaderChanged = this.loaderData !== this._contextData;
    if (isServer || !(changed.has('_items') || loaderChanged)) return;
    this._contextData = this.loaderData;
    const {text = '', tab, categoryId, categories = [], articles} = this.loaderData || {};
    this.setAiContext({
      search: text,
      tab,
      category: categories.find(category => category.sys_id === categoryId)?.title || '',
      items: this._items.map(item => ({sysId: item.sys_id, name: item.name})),
      articles: (articles || []).map(article => ({number: article.number.display_value, title: article.short_description.display_value}))
    });
  }

  get _view() {
    const {text = '', tab = 'all', categoryId = ''} = this.loaderData || {};
    return {text, tab, categoryId};
  }

  _go(changes) {
    navigate('/explore', {query: exploreQuery({...this._view, ...changes})});
  }

  _search(e) {
    e.preventDefault();
    this._go({text: new FormData(e.target).get('q')?.toString().trim() || ''});
  }

  async _loadMore() {
    if (this._loadingMore) return;
    const {text, categoryId} = this._view;
    try {
      this._loadingMore = true;
      this._moreError = '';
      const page = await itemsPage({categoryId, text, offset: this._items.length, limit: ITEMS_PAGE_SIZE});
      this._items = [...this._items, ...page.slice(0, ITEMS_PAGE_SIZE)];
      this._hasMore = page.length > ITEMS_PAGE_SIZE;
    } catch (error) {
      log.error({error: error.message}, 'Failed to load more items');
      this._moreError = i18n.getMessage('More items could not be loaded. Try again.');
    } finally {
      this._loadingMore = false;
    }
  }

  _renderCategories() {
    const {categories = []} = this.loaderData || {};
    if (!categories.length) return nothing;
    const active = this._view.categoryId;
    const options = [{sys_id: '', title: i18n.getMessage('All categories')}, ...categories];
    return html`<ul class="flex flex-wrap gap-2" aria-label=${i18n.getMessage('Categories')}>
      ${options.map(
        category => html`<li>
          <button
            type="button"
            class="aiux-btn aiux-btn-sm h-auto min-h-8 whitespace-normal py-1 ${category.sys_id === active ? 'aiux-btn-primary' : 'aiux-btn-outline'}"
            aria-pressed=${category.sys_id === active ? 'true' : 'false'}
            @click=${() => this._go({categoryId: category.sys_id, tab: this._view.tab === 'all' ? 'services' : this._view.tab})}
          >
            ${category.title}
          </button>
        </li>`
      )}
    </ul>`;
  }

  _renderServices({preview}) {
    const {text} = this._view;
    if (this.loaderData?.items === null) {
      return html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
        ${i18n.getMessage('The catalog could not be loaded. Try again later.')}
      </div>`;
    }
    if (!this._items.length) {
      return html`<aiux-empty-state-content
        heading=${text ? i18n.getMessage('No services match "{0}"', text) : i18n.getMessage('No items in this category')}
        body=${i18n.getMessage('Try other words or another category, or let an agent plan it for you.')}
      ></aiux-empty-state-content>`;
    }
    return html`<luxesc-item-gallery .items=${this._items}></luxesc-item-gallery>
      ${preview && this._hasMore
        ? html`<button type="button" class="aiux-btn aiux-btn-outline self-start" @click=${() => this._go({tab: 'services'})}>
            ${i18n.getMessage('See all services')}
          </button>`
        : nothing}
      ${!preview && this._hasMore
        ? html`<div class="flex justify-center">
            <button type="button" class="aiux-btn aiux-btn-outline" ?disabled=${this._loadingMore} @click=${this._loadMore}>
              ${this._loadingMore ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>` : nothing}
              ${i18n.getMessage('Show more')}
            </button>
          </div>`
        : nothing}
      ${this._moreError ? html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">${this._moreError}</div>` : nothing}`;
  }

  _renderAnswers({preview}) {
    const {text} = this._view;
    const {articles, basePath = ''} = this.loaderData || {};
    if (articles === null) {
      return html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
        ${i18n.getMessage('The knowledge base could not be loaded. Try again later.')}
      </div>`;
    }
    if (!articles?.length) {
      return html`<aiux-empty-state-content
        heading=${text ? i18n.getMessage('No answers match "{0}"', text) : i18n.getMessage('No articles available')}
        body=${i18n.getMessage('Try other words, or ask the assistant.')}
      ></aiux-empty-state-content>`;
    }
    return html`<ul class="flex flex-col divide-y divide-base-300">
        ${articles.map(article => {
          const meta = preview
            ? article.number.display_value
            : i18n.getMessage(
                '{0} · {1} · Updated {2}',
                article.number.display_value,
                [article.kb_knowledge_base.display_value, article.kb_category.display_value].filter(Boolean).join(' · '),
                article.sys_updated_on.display_value
              );
          return html`<li>
            <a class="flex flex-col gap-1 rounded-box px-2 py-3 hover:bg-base-200 focus-visible:bg-base-200" href="${basePath}/knowledge/${article.sys_id.value}">
              <span class="break-words font-medium">${article.short_description.display_value}</span>
              <span class="text-xs text-text-secondary">${meta}</span>
            </a>
          </li>`;
        })}
      </ul>
      ${preview && articles.length >= PREVIEW_ARTICLES
        ? html`<button type="button" class="aiux-btn aiux-btn-outline self-start" @click=${() => this._go({tab: 'answers', categoryId: ''})}>
            ${i18n.getMessage('See all answers')}
          </button>`
        : nothing}`;
  }

  _renderPlanner() {
    if (this._planning) return html`<luxesc-planner></luxesc-planner>`;
    return html`<div class="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-4">
      <span class="text-primary">${icon({name: 'ai-sparkle', size: 'sm'})}</span>
      <p class="min-w-0 flex-1 basis-64 text-sm">
        ${i18n.getMessage('Need several things at once, like everything for a new hire? Describe it and an agent plans the whole request.')}
      </p>
      <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-outline" @click=${() => (this._planning = true)}>
        ${i18n.getMessage('Plan a bigger request')}
      </button>
    </div>`;
  }

  _renderBody() {
    const {tab, categoryId} = this._view;
    const {categories = []} = this.loaderData || {};
    const category = categories.find(c => c.sys_id === categoryId);
    if (tab === 'services') {
      return html`<section class="flex flex-col gap-4" aria-labelledby="services-title">
        <h2 id="services-title" class="sr-only">${i18n.getMessage('Services')}</h2>
        ${this._renderCategories()}
        ${category?.description ? html`<p class="max-w-full break-words text-sm text-text-secondary">${category.description}</p>` : nothing}
        <div class="flex flex-col gap-4">${this._renderServices({preview: false})}</div>
      </section>`;
    }
    if (tab === 'answers') {
      return html`<section class="aiux-card border border-base-300 bg-base-100" aria-labelledby="answers-title">
        <div class="aiux-card-body gap-2 max-sm:p-4">
          <h2 id="answers-title" class="sr-only">${i18n.getMessage('Answers')}</h2>
          ${this._renderAnswers({preview: false})}
        </div>
      </section>`;
    }
    return html`<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section class="flex min-w-0 flex-col gap-4 lg:col-span-2" aria-labelledby="services-title">
        <h2 id="services-title" class="text-lg font-semibold">${i18n.getMessage('Services')}</h2>
        ${this._renderCategories()}
        ${this._renderServices({preview: true})}
      </section>
      <section class="aiux-card h-fit min-w-0 border border-base-300 bg-base-100" aria-labelledby="answers-title">
        <div class="aiux-card-body gap-2 max-sm:p-4">
          <h2 id="answers-title" class="aiux-card-title text-lg">
            ${this._view.text ? i18n.getMessage('Answers') : i18n.getMessage('Most read answers')}
          </h2>
          ${this._renderAnswers({preview: true})}
        </div>
      </section>
    </div>`;
  }

  render() {
    const {text, tab} = this._view;
    const tabs = [
      {id: 'all', label: i18n.getMessage('All')},
      {id: 'services', label: i18n.getMessage('Services')},
      {id: 'answers', label: i18n.getMessage('Answers')}
    ];
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:p-8">
      <header class="flex flex-col gap-3">
        <h1 class="text-2xl font-bold sm:text-3xl">${i18n.getMessage('Explore')}</h1>
        <p class="text-text-secondary">${i18n.getMessage('Services you can request and answers you can read, in one place.')}</p>
        <form role="search" aria-label=${i18n.getMessage('Search services and answers')} class="flex w-full flex-col gap-2 sm:flex-row" @submit=${this._search}>
          <label class="aiux-input aiux-input-lg w-full">
            ${icon({name: 'magnifying-glass', size: 'sm'})}
            <span class="sr-only">${i18n.getMessage('Search services and answers')}</span>
            <input type="search" name="q" .value=${text} placeholder=${i18n.getMessage('Search services and answers')} />
          </label>
          <button type="submit" class="aiux-btn aiux-btn-lg aiux-btn-primary">${i18n.getMessage('Search')}</button>
        </form>
      </header>
      <aiux-tab-group
        variant="bordered"
        tablist-label=${i18n.getMessage('What to show')}
        .tabs=${tabs}
        .activeTab=${tab}
        @aiux-tab-group:tab-change=${e => this._go({tab: e.detail.id, categoryId: e.detail.id === 'answers' ? '' : this._view.categoryId})}
      ></aiux-tab-group>
      ${tab === 'answers' ? nothing : this._renderPlanner()}
      ${this._renderBody()}
    </div>`;
  }
}
