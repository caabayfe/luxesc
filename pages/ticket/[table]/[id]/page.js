import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {navigate} from '@servicenow/aiux/aiux-client';

const {acl, title} = decorators;

/**
 * The assistant's record cards (a requested item or incident it just raised)
 * link to /ticket/{table}/{sys_id}. Forwards to the app's own page for the
 * record: knowledge articles to /knowledge, everything else (tasks) to /requests.
 */
@customElement('x-everi-luxesc-ticket-link-page')
@title('Request')
@acl([{securityAttribute: 'user_is_authenticated'}])
export default class TicketLinkPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static async loader(ctx) {
    return {table: String(ctx.params.table || ''), sysId: String(ctx.params.id || '')};
  }

  firstUpdated() {
    const {table, sysId} = this.loaderData || {};
    navigate(table === 'kb_knowledge' ? `/knowledge/${sysId}` : `/requests/${sysId}`, {replace: true});
  }

  render() {
    return html`<div class="mx-auto flex max-w-6xl flex-col gap-4 p-4 lg:p-8" aria-hidden="true">
      <div class="aiux-skeleton h-9 w-48"></div>
      <div class="aiux-skeleton h-40 w-full"></div>
    </div>`;
  }
}
