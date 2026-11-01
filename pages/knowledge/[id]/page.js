import {html, css, nothing, isServer} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators, getLogger, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import '@servicenow/aiux/aiux-components-empty-state-content';
import {fetchRecord} from '../../../utils/api.js';
import {setDocumentTitle} from '../../../utils/document-title.js';
import {chatContext, isChatEnabled} from '../../../utils/chat.js';
import '../../../components/luxesc-ask.js';
import '../../../components/luxesc-rich-text.js';

const {acl, title} = decorators;
const log = getLogger('luxesc-knowledge');

// The Table API applies the knowledge ACLs (and user criteria), so an article the employee may not read never loads
const ARTICLE_FIELDS = 'sys_id,number,short_description,text,kb_knowledge_base,sys_updated_on,workflow_state';

@customElement('x-everi-luxesc-knowledge-page')
@title('Knowledge article')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class KnowledgePage extends withWidgetContext(AIUXElement) {
  static contexts = [chatContext];

  static aiContext = {
    description: 'A knowledge article the employee is reading: number, title and its text',
    bestFor: 'When the employee asks how to follow the article, or whether it applies to their problem'
  };

  static styles = css`
    :host {
      display: block;
    }
  `;

  static async loader(ctx) {
    const basePath = ctx.basePath || '';
    try {
      const article = await fetchRecord('kb_knowledge', ctx.params.id, ARTICLE_FIELDS);
      return {basePath, article: article?.workflow_state?.value === 'published' ? article : null};
    } catch (error) {
      log.error({error: error.message}, 'Failed to load article');
      return {basePath, article: null};
    }
  }

  firstUpdated() {
    setDocumentTitle(this.loaderData?.article?.short_description?.display_value || i18n.getMessage('Knowledge article'));
  }

  // loaderData is not a reactive property, so a new loader result is spotted by reference
  updated(changed) {
    super.updated?.(changed);
    const article = this.loaderData?.article;
    if (isServer || !article || this.loaderData === this._contextData) return;
    this._contextData = this.loaderData;
    const plain = new DOMParser().parseFromString(article.text.value || '', 'text/html').body.textContent || '';
    this.setAiContext({
      article: {
        number: article.number.display_value,
        title: article.short_description.display_value,
        text: plain.replace(/\s+/g, ' ').trim().slice(0, 4000)
      }
    });
  }

  render() {
    const {basePath = '', article} = this.loaderData || {};
    if (!article) {
      return html`<div class="mx-auto max-w-3xl p-4 lg:p-8">
        <aiux-empty-state-content
          heading=${i18n.getMessage('This article is not available')}
          body=${i18n.getMessage('It may have been retired, or you do not have access to it.')}
        ></aiux-empty-state-content>
      </div>`;
    }
    const number = article.number.display_value;
    return html`<article class="mx-auto flex max-w-3xl flex-col gap-6 p-4 lg:p-8">
      <nav class="aiux-breadcrumbs text-sm" aria-label=${i18n.getMessage('Breadcrumb')}>
        <ul>
          <li><a href="${basePath}/start">${i18n.getMessage('Home')}</a></li>
          <li aria-current="page">${number}</li>
        </ul>
      </nav>
      <header class="flex flex-col gap-1">
        <h1 class="max-w-full break-words text-2xl font-bold">${article.short_description.display_value}</h1>
        <p class="text-sm text-text-secondary">
          ${i18n.getMessage('{0} · {1} · Updated {2}', number, article.kb_knowledge_base.display_value, article.sys_updated_on.display_value)}
        </p>
      </header>
      ${isChatEnabled()
        ? html`<luxesc-ask
            label=${i18n.getMessage('Ask about this article')}
            placeholder=${i18n.getMessage('Ask anything about {0}', number)}
            .suggestions=${[
              {label: i18n.getMessage('Walk me through it'), question: i18n.getMessage('Walk me through {0} step by step.', number)},
              {label: i18n.getMessage('Does it fit my problem?'), question: i18n.getMessage('Does {0} apply to my problem? Ask me what you need to know.', number)}
            ]}
          ></luxesc-ask>`
        : nothing}
      <section class="aiux-card bg-base-100 shadow-sm">
        <div class="aiux-card-body">
          <luxesc-rich-text name="text" full .label=${i18n.getMessage('Article')} .value=${article.text.value || ''}></luxesc-rich-text>
        </div>
      </section>
    </article>`;
  }
}
