import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators, withWidgetContext} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';
import {exploreQuery} from '../../utils/explore.js';

const {acl, title} = decorators;

/**
 * Knowledge now lives in Explore (Answers tab). Old links and bookmarks to
 * /knowledge (with their search) forward there.
 */
@customElement('x-everi-luxesc-knowledge-search-page')
@title('Explore')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class KnowledgeSearchPage extends withWidgetContext(AIUXElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static async loader(ctx) {
    return {text: String(ctx.query?.q || '').trim()};
  }

  firstUpdated() {
    const {text = ''} = this.loaderData || {};
    navigate('/explore', {query: exploreQuery({text, tab: 'answers'}), replace: true});
  }

  render() {
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-4 p-4 lg:p-8" aria-hidden="true">
      <div class="aiux-skeleton h-9 w-48"></div>
      <div class="aiux-skeleton h-12 w-full"></div>
    </div>`;
  }
}
