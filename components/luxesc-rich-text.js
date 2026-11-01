import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {
  createFormControl,
  FieldType,
  FormFieldEditMode
} from '@servicenow/aiux/aiux-components-control';

const FIELD_LAYOUT = {layout: 'vertical'};
const noop = () => {};

/**
 * Read-only HTML from the platform (item descriptions, rich-text labels),
 * rendered by the OOB HTML control in display-only mode so the control's own
 * sanitising applies.
 */
@customElement('luxesc-rich-text')
export class RichText extends AIUXElement {
  @property({type: String}) name = 'rich_text';
  @property({type: String}) label = '';
  @property({type: String}) value = '';
  // The control scrolls past 200px; full shows long content (articles) in the page flow
  @property({type: Boolean}) full = false;

  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    const field = {
      name: this.name,
      label: this.label,
      type: FieldType.Html,
      value: this.value,
      displayValue: this.value,
      visible: true,
      readonly: true,
      mandatory: false,
      ...(this.full ? {controlStyles: 'max-height: none'} : {})
    };
    return html`${createFormControl(field, FIELD_LAYOUT, noop, undefined, {
      editMode: FormFieldEditMode.DISPLAY_ONLY
    })}`;
  }
}
