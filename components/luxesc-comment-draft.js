import {html, css, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {withRecordContext} from '@servicenow/aiux/aiux-components-record';
import {i18n} from '@servicenow/aiux/aiux-services';

// Additional comments: the journal the requester and the people working on it share
const FIELD = 'comments';
const WATCH_MS = 1000;

/**
 * Puts a comment the assistant drafted into the record's own comment box
 * (inside aiux-record-provider, next to aiux-record-activity-compose). The
 * employee reviews or edits it there and sends it with the box's button, so
 * nothing is posted in their name until they do.
 */
@customElement('luxesc-comment-draft')
export class CommentDraft extends withRecordContext(AIUXElement) {
  @state() _shown = false;

  static styles = css`
    :host {
      display: block;
    }
  `;

  get _compose() {
    return this._record?.apis.compose;
  }

  // False when the employee cannot comment on this record
  propose(text) {
    const compose = this._compose;
    if (!compose?.hasField(FIELD)) return false;
    compose.setSelectedField(FIELD);
    compose.setValue(FIELD, text);
    compose.setPostEnabled(FIELD, true);
    this._shown = true;
    this._watch();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
    return true;
  }

  // Sending or clearing the comment empties the box: the note has nothing left to explain
  _watch() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (!this._compose?.getField(FIELD)?.value) this._hide();
    }, WATCH_MS);
  }

  _hide() {
    clearInterval(this._timer);
    this._shown = false;
  }

  _discard() {
    this._compose?.setValue(FIELD, '');
    this._compose?.setPostEnabled(FIELD, false);
    this._hide();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._timer);
  }

  // The live region stays in place so the note is announced when it appears
  render() {
    return html`<div role="status">
      ${this._shown
        ? html`<div class="aiux-alert aiux-alert-info aiux-alert-soft mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>${i18n.getMessage('The assistant drafted this comment. Review or edit it below, then send it.')}</span>
            <button type="button" class="aiux-btn aiux-btn-sm aiux-btn-ghost" @click=${this._discard}>
              ${i18n.getMessage('Discard')}
            </button>
          </div>`
        : nothing}
    </div>`;
  }
}
