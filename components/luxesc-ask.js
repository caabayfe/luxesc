import {html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';

/**
 * Opens the Now Assist chat with a new conversation seeded from `prompt`.
 * Uses the nav layout's own `aiux:open-chat` event, so the assistant keeps the
 * page context (setAiContext) and the page's client tools.
 */
export function askAssistant(host, prompt) {
  host.dispatchEvent(
    new CustomEvent('aiux:open-chat', {
      bubbles: true,
      composed: true,
      detail: {forceNewConversation: true, sessionContext: {searchText: prompt}}
    })
  );
}

/**
 * Free-text question plus suggestion chips that hand off to the assistant.
 * `prefix` frames the employee's words for the assistant (for example "Fill in
 * the order form on this page:"); suggestions carry their own full question.
 */
@customElement('luxesc-ask')
export class Ask extends AIUXElement {
  @property({type: String}) label = '';
  @property({type: String}) placeholder = '';
  @property({type: String}) action = '';
  @property({type: String}) prefix = '';
  @property({type: Boolean}) multiline = false;
  @property({type: Boolean}) inverse = false;
  @property({type: Array}) suggestions = [];

  @state() _text = '';

  static styles = css`
    :host {
      display: block;
    }
  `;

  _ask(prompt) {
    if (prompt) askAssistant(this, prompt);
  }

  _submit(e) {
    e.preventDefault();
    const text = this._text.trim();
    if (!text) return;
    this._ask(this.prefix ? `${this.prefix} ${text}` : text);
    this._text = '';
  }

  _onInput(e) {
    this._text = e.target.value;
  }

  _onKeydown(e) {
    // Enter sends, Shift+Enter keeps a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.target.form?.requestSubmit();
    }
  }

  _renderField() {
    const common = {
      label: this.label || i18n.getMessage('Ask the assistant'),
      placeholder: this.placeholder || i18n.getMessage('Describe what you need')
    };
    return this.multiline
      ? html`<label class="aiux-fieldset w-full">
          <span class="sr-only">${common.label}</span>
          <textarea
            class="aiux-textarea w-full text-text-primary"
            rows="3"
            .value=${this._text}
            placeholder=${common.placeholder}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
          ></textarea>
        </label>`
      : html`<label class="aiux-input aiux-input-lg w-full text-text-primary">
          <span class="sr-only">${common.label}</span>
          <input
            type="text"
            .value=${this._text}
            placeholder=${common.placeholder}
            @input=${this._onInput}
          />
        </label>`;
  }

  render() {
    const chipClass = this.inverse
      ? 'aiux-btn aiux-btn-sm aiux-btn-outline border-primary-content text-primary-content'
      : 'aiux-btn aiux-btn-sm aiux-btn-soft';
    return html`<div class="flex w-full flex-col gap-3">
      <form
        class="flex w-full flex-col gap-2 ${this.multiline ? '' : 'sm:flex-row'}"
        aria-label=${this.label || i18n.getMessage('Ask the assistant')}
        @submit=${this._submit}
      >
        ${this._renderField()}
        <button
          type="submit"
          class="aiux-btn ${this.multiline ? 'self-end' : 'aiux-btn-lg'} ${this.inverse
            ? 'aiux-btn-secondary'
            : 'aiux-btn-primary'}"
          ?disabled=${!this._text.trim()}
        >
          ${this.action || i18n.getMessage('Ask')}
        </button>
      </form>
      ${this.suggestions.length
        ? html`<ul
            class="flex flex-wrap gap-2 ${this.inverse ? 'justify-center' : ''}"
            aria-label=${i18n.getMessage('Suggestions')}
          >
            ${this.suggestions.map(
              suggestion => html`<li>
                <button type="button" class=${chipClass} @click=${() => this._ask(suggestion.question)}>
                  ${suggestion.label}
                </button>
              </li>`
            )}
          </ul>`
        : nothing}
    </div>`;
  }
}
