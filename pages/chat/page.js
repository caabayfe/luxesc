import {html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement, decorators} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import '@servicenow/aiux/aiux-components-chat';
import {setDocumentTitle} from '../../utils/document-title.js';

const {acl, title} = decorators;

// Full-page conversation with the assistant; the home chat hands off here
@customElement('x-everi-luxesc-chat-page')
@title('Assistant')
@acl([{roles: ['snc_internal']}])
export default class ChatPage extends AIUXElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;

  static async loader(ctx) {
    return {conversationId: ctx.query?.chat_id || ''};
  }

  firstUpdated() {
    setDocumentTitle(i18n.getMessage('Assistant'));
  }

  render() {
    const conversationId = this.loaderData?.conversationId || '';
    return html`<div class="mx-auto flex h-full w-full max-w-4xl flex-col p-4">
      <h1 class="sr-only">${i18n.getMessage('Assistant')}</h1>
      <sn-aiux-chat-wrapper
        class="min-h-0 flex-1"
        .inputOnly=${false}
        .conversationId=${conversationId}
        .forceNewConversation=${!conversationId}
      ></sn-aiux-chat-wrapper>
    </div>`;
  }
}
