import {html, css, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators, getLogger, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {navigate} from '@servicenow/aiux/aiux-client';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchRecords} from '../../utils/api.js';
import {setDocumentTitle} from '../../utils/document-title.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-knowledge-search');

const LIMIT = 20;
const FIELDS = 'sys_id,number,short_description,kb_knowledge_base,kb_category,sys_view_count,sys_updated_on';
// The Table API applies the knowledge ACLs and user criteria, so only articles the employee may read come back
const PUBLISHED = 'workflow_state=published^active=true';

// Without a search the most read articles; with one, every word must match (platform text search)
function articlesQuery(text) {
  const words = text.replace(/[\^=]/g, ' ').trim();
  return words ? `${PUBLISHED}^123TEXTQUERY321=${words}` : `${PUBLISHED}^ORDERBYDESCsys_view_count`;
}

@customElement('x-everi-luxesc-knowledge-search-page')
@title('Knowledge')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class KnowledgeSearchPage extends withWidgetContext(AIUXElement) {
  static aiContext = {
    description: 'Knowledge articles the employee can read: the most read ones, or the results of their search',
    bestFor: 'When the employee looks for how-to guides or answers to common problems'
  };

  static client_tools = {
    search_knowledge: {
      description: 'Search the knowledge base and show the matching articles on this page.',
      arguments: [{name: 'text', description: 'Words to search for', type: 'string', required: true}],
      definition: async function ({text} = {}) {
        navigate('/knowledge', {query: {q: String(text || '').trim()}});
        return {success: true};
      }
    }
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  static async loader(ctx) {
    const text = String(ctx.query?.q || '').trim();
    try {
      const articles = await fetchRecords('kb_knowledge', {encodedQuery: articlesQuery(text), fields: FIELDS, limit: LIMIT});
      return {basePath: ctx.basePath || '', text, articles: articles || []};
    } catch (error) {
      log.error({error: error.message}, 'Failed to load articles');
      return {basePath: ctx.basePath || '', text, articles: null};
    }
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Knowledge'));
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    if (isServer || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    const {text = '', articles} = this.loaderData || {};
    this.setAiContext({
      search: text,
      articles: (articles || []).map(article => ({number: article.number.display_value, title: article.short_description.display_value}))
    });
  }

  _search(e) {
    e.preventDefault();
    const text = new FormData(e.target).get('q')?.toString().trim();
    navigate('/knowledge', {query: text ? {q: text} : {}});
  }

  _renderArticle(article) {
    const meta = [article.kb_knowledge_base.display_value, article.kb_category.display_value].filter(Boolean).join(' · ');
    return html`<li>
      <a
        class="flex flex-col gap-1 rounded-box px-3 py-3 hover:bg-base-200 focus-visible:bg-base-200"
        href="${this.loaderData.basePath}/knowledge/${article.sys_id.value}"
      >
        <span class="break-words font-medium text-primary">${article.short_description.display_value}</span>
        <span class="text-sm text-text-secondary">
          ${i18n.getMessage('{0} · {1} · Updated {2}', article.number.display_value, meta, article.sys_updated_on.display_value)}
        </span>
      </a>
    </li>`;
  }

  _renderResults() {
    const {text, articles} = this.loaderData || {};
    if (articles === null) {
      return html`<div class="aiux-alert aiux-alert-error aiux-alert-soft" role="alert">
        ${i18n.getMessage('The knowledge base could not be loaded. Try again later.')}
      </div>`;
    }
    if (!articles?.length) {
      return html`<aiux-empty-state-content
        heading=${text ? i18n.getMessage('No results for "{0}"', text) : i18n.getMessage('No articles available')}
        description=${i18n.getMessage('Try other words, or ask the assistant.')}
      ></aiux-empty-state-content>`;
    }
    return html`<ul class="flex flex-col divide-y divide-base-300">
      ${articles.map(article => this._renderArticle(article))}
    </ul>`;
  }

  render() {
    const {text = ''} = this.loaderData || {};
    return html`<div class="mx-auto flex max-w-4xl flex-col gap-6 p-4 lg:p-8">
      <header class="flex flex-col gap-3">
        <h1 class="text-2xl font-bold">${i18n.getMessage('Knowledge')}</h1>
        <form role="search" aria-label=${i18n.getMessage('Search knowledge')} class="flex w-full gap-2" @submit=${this._search}>
          <label class="aiux-input w-full">
            <span class="sr-only">${i18n.getMessage('Search knowledge')}</span>
            <input type="search" name="q" .value=${text} placeholder=${i18n.getMessage('Search how-to guides and answers')} />
          </label>
          <button type="submit" class="aiux-btn aiux-btn-primary">${i18n.getMessage('Search')}</button>
        </form>
      </header>
      <section class="aiux-card border border-base-300 bg-base-100" aria-labelledby="articles-title">
        <div class="aiux-card-body gap-2">
          <h2 id="articles-title" class="aiux-card-title text-lg">
            ${text ? i18n.getMessage('Results for "{0}"', text) : i18n.getMessage('Most read articles')}
          </h2>
          ${this._renderResults()}
        </div>
      </section>
    </div>`;
  }
}
