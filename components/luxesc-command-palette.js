import {html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import './luxesc-command-box.js';

/**
 * The one box from any page (⌘K / Ctrl+K): the same "What do you need?" box
 * as on For you, in a modal. Following a match or handing the text to the
 * assistant closes it (the modal would keep the focus away from the chat).
 */
@customElement('luxesc-command-palette')
export class CommandPalette extends AIUXElement {
  @property({type: String}) basePath = '';
  // The box is only rendered while open, so every opening starts afresh
  @state() _open = false;

  static styles = css`
    :host {
      display: contents;
    }
  `;

  show() {
    if (this._open) return;
    this._open = true;
    this.updateComplete.then(() => this.renderRoot.querySelector('luxesc-command-box')?.focus());
  }

  _close() {
    this._open = false;
  }

  // The palette lives on <body>, outside the app layout that opens the chat, so the hand-off
  // is passed on from the layout
  _onOpenChat(e) {
    this._close();
    const layout = document.querySelector('aiux-nav-layout');
    if (!layout || layout.contains(this)) return;
    e.stopPropagation();
    layout.dispatchEvent(new CustomEvent(e.type, {bubbles: true, composed: true, detail: e.detail}));
  }

  // A click on a match (a link inside the box) leaves the page, so the palette closes
  _onClick(e) {
    if (e.composedPath().some(node => node.tagName === 'A' && node.href)) this._close();
  }

  render() {
    return html`<aiux-modal
      size="lg"
      no-dividers
      hide-actions
      close-on-backdrop
      .open=${this._open}
      close-label=${i18n.getMessage('Close')}
      @aiux-modal:close=${this._close}
    >
      <h5 slot="header" id="modal-header">${i18n.getMessage('What do you need?')}</h5>
      ${this._open
        ? html`<luxesc-command-box
            bare
            .basePath=${this.basePath}
            @click=${this._onClick}
            @aiux:open-chat=${this._onOpenChat}
          ></luxesc-command-box>`
        : nothing}
    </aiux-modal>`;
  }
}
