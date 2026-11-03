import {html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {AIUXElement, getLogger} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {icon} from '@servicenow/aiux/aiux-directive-icon';
import {addComment, attachmentUrl, uploadAttachment} from '../utils/api.js';

const log = getLogger('luxesc-ticket-conversation');

const MINUTE = 60 * 1000;
const UNITS = [
  ['year', 365 * 24 * 60],
  ['month', 30 * 24 * 60],
  ['week', 7 * 24 * 60],
  ['day', 24 * 60],
  ['hour', 60],
  ['minute', 1]
];

// "3 hours ago"; the exact date stays in the title
export function ago(when) {
  if (!when) return '';
  const minutes = Math.round((when - Date.now()) / MINUTE);
  if (Math.abs(minutes) < 1) return i18n.getMessage('just now');
  const format = new Intl.RelativeTimeFormat(document.documentElement.lang || undefined, {numeric: 'auto'});
  const [unit, size] = UNITS.find(([, size]) => Math.abs(minutes) >= size) || ['minute', 1];
  return format.format(Math.round(minutes / size), unit);
}

const initial = name => (String(name || '?').trim()[0] || '?').toUpperCase();

/**
 * The conversation between the employee and the people working on one of their
 * requests or incidents: a comment box (with Attach) and the customer-visible
 * comments and files, newest first. Work notes never reach it: the thread comes
 * from GET /tickets/{task}, which does not read them.
 *
 * propose(text) puts a comment the assistant drafted into the box; nothing is
 * posted until the employee sends it. Fires luxesc-ticket-conversation:changed
 * after a comment or file was added, so the page reads the ticket again.
 */
@customElement('luxesc-ticket-conversation')
export class TicketConversation extends AIUXElement {
  @property({type: String}) table = '';
  @property({type: String, attribute: 'record-id'}) recordId = '';
  @property({type: Array}) thread = [];
  @property({type: Boolean, attribute: 'can-comment'}) canComment = false;
  @property({type: Boolean, attribute: 'can-attach'}) canAttach = false;
  // Shown under the thread: when the record was opened
  @property({type: String, attribute: 'opened-at'}) openedAt = '';

  @state() _text = '';
  // The box holds a draft from the assistant
  @state() _drafted = false;
  // Placeholder for the box; the page asks "What is still wrong?" when a fix did not work
  @state() _prompt = '';
  @state() _busy = '';
  @state() _error = '';
  @state() _status = '';

  static styles = css`
    :host {
      display: block;
    }
  `;

  get _box() {
    return this.renderRoot.querySelector('textarea');
  }

  // False when the employee cannot comment on this record
  propose(text) {
    if (!this.canComment) return false;
    this._text = text;
    this._drafted = true;
    this._status = i18n.getMessage('The assistant drafted a comment. Review or edit it, then send it.');
    this._reveal();
    return true;
  }

  // Focus the box, with a question that tells the employee what to write
  ask(prompt) {
    this._prompt = prompt;
    this._reveal();
  }

  async _reveal() {
    await this.updateComplete;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._box?.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
    this._box?.focus({preventScroll: true});
  }

  _discard() {
    this._text = '';
    this._drafted = false;
    this._status = '';
    this._box?.focus();
  }

  _changed() {
    this.dispatchEvent(new CustomEvent('luxesc-ticket-conversation:changed', {bubbles: true, composed: true}));
  }

  async _send(e) {
    e.preventDefault();
    const text = this._text.trim();
    if (!text || this._busy) return;
    this._busy = 'comment';
    this._error = '';
    try {
      await addComment(this.table, this.recordId, text);
      this._text = '';
      this._drafted = false;
      this._prompt = '';
      this._status = i18n.getMessage('Comment sent. The people working on it will see it.');
      this._changed();
    } catch (error) {
      log.error({error: error.message}, 'Comment failed');
      this._error = i18n.getMessage('Your comment was not sent: {0}', error.message);
    } finally {
      this._busy = '';
    }
  }

  _onKeydown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) this._send(e);
  }

  // Opens the file picker; the page's Attachments card uses it too
  pickFiles() {
    this.renderRoot.querySelector('input[type="file"]')?.click();
  }

  async _attach(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    this._busy = 'file';
    this._error = '';
    try {
      for (const file of files) await uploadAttachment(this.table, this.recordId, file);
      this._status =
        files.length === 1
          ? i18n.getMessage('{0} added.', files[0].name)
          : i18n.getMessage('{0} files added.', String(files.length));
      this._changed();
    } catch (error) {
      log.error({error: error.message}, 'Upload failed');
      this._error = i18n.getMessage('The file was not added: {0}', error.message);
    } finally {
      this._busy = '';
    }
  }

  _renderComposer() {
    const placeholder = this._prompt || i18n.getMessage('Write to the people working on it');
    return html`<form class="flex flex-col gap-2" aria-label=${i18n.getMessage('Write a comment')} @submit=${this._send}>
      ${this._drafted
        ? html`<p class="flex flex-wrap items-center gap-2 text-sm text-info">
            ${icon({name: 'ai-sparkle', size: 'sm'})}
            <span class="grow">${i18n.getMessage('Drafted by the assistant. Review it, then send it.')}</span>
            <button type="button" class="aiux-btn aiux-btn-xs aiux-btn-ghost" @click=${this._discard}>
              ${i18n.getMessage('Discard')}
            </button>
          </p>`
        : nothing}
      <div
        class="flex flex-col rounded-box border bg-base-100 focus-within:outline-2 focus-within:outline-offset-2 ${this._drafted
          ? 'border-info'
          : 'border-base-300'}"
      >
        <label class="sr-only" for="comment">${i18n.getMessage('Your comment')}</label>
        <textarea
          id="comment"
          class="min-h-20 w-full resize-y rounded-t-box bg-transparent p-3 text-sm outline-none"
          rows="3"
          placeholder=${placeholder}
          .value=${this._text}
          ?disabled=${this._busy === 'comment'}
          @input=${e => (this._text = e.target.value)}
          @keydown=${this._onKeydown}
        ></textarea>
        <div class="flex items-center justify-between gap-2 border-t border-base-300 px-2 py-1.5">
          ${this.canAttach
            ? html`<button
                  type="button"
                  class="aiux-btn aiux-btn-sm aiux-btn-ghost"
                  ?disabled=${!!this._busy}
                  @click=${this.pickFiles}
                >
                  ${this._busy === 'file'
                    ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
                    : icon({name: 'paperclip', size: 'sm'})}
                  ${i18n.getMessage('Attach')}
                </button>
                <input type="file" multiple class="hidden" aria-label=${i18n.getMessage('Attach files')} @change=${this._attach} />`
            : html`<span></span>`}
          <button type="submit" class="aiux-btn aiux-btn-sm aiux-btn-primary" ?disabled=${!this._text.trim() || !!this._busy}>
            ${this._busy === 'comment'
              ? html`<span class="aiux-loading aiux-loading-spinner aiux-loading-xs"></span>`
              : icon({name: 'send', size: 'sm'})}
            ${i18n.getMessage('Send')}
          </button>
        </div>
      </div>
      ${this._error ? html`<p class="text-sm text-error" role="alert">${this._error}</p>` : nothing}
    </form>`;
  }

  _renderEntry(entry) {
    const author = entry.you ? i18n.getMessage('You') : entry.author;
    return html`<li class="flex gap-3">
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${entry.you
          ? 'bg-info/15 text-info'
          : 'bg-base-200 text-text-secondary'}"
        aria-hidden="true"
        >${initial(entry.author)}</span
      >
      <div class="flex min-w-0 grow flex-col gap-1">
        <p class="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span class="font-semibold">${author}</span>
          <time class="text-xs text-text-secondary" title=${entry.at}>${ago(entry.when)}</time>
        </p>
        ${entry.kind === 'file'
          ? html`<a
              class="aiux-link inline-flex max-w-full items-center gap-1 text-sm"
              href=${attachmentUrl(entry.file)}
              target="_blank"
              rel="noopener"
            >
              ${icon({name: 'paperclip', size: 'sm'})}
              <span class="truncate">${i18n.getMessage('Added {0}', entry.text)}</span>
            </a>`
          : html`<p
              class="m-0 whitespace-pre-line break-words rounded-box px-3 py-2 text-sm ${entry.you ? 'bg-info/10' : 'bg-base-200'}"
            >${entry.text}</p>`}
      </div>
    </li>`;
  }

  render() {
    return html`<div class="flex flex-col gap-5">
      ${this.canComment ? this._renderComposer() : nothing}
      <p class="sr-only" role="status">${this._status}</p>
      ${!this.thread.length
        ? html`<p class="text-sm text-text-secondary">
            ${this.canComment
              ? i18n.getMessage('No messages yet. Write here to add details or ask about progress.')
              : i18n.getMessage('No messages yet.')}
          </p>`
        : nothing}
      <ol class="flex flex-col gap-4" aria-label=${i18n.getMessage('Conversation')}>
        ${this.thread.map(entry => this._renderEntry(entry))}
        ${this.openedAt
          ? html`<li class="flex items-center gap-3 text-xs text-text-secondary">
              <span class="flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
                <span class="size-2 rounded-full bg-base-300"></span>
              </span>
              ${i18n.getMessage('Opened · {0}', this.openedAt)}
            </li>`
          : nothing}
      </ol>
    </div>`;
  }
}
