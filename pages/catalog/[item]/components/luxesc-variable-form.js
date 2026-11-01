import {html, css, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import {createFormControl} from '@servicenow/aiux/aiux-components-control';
import '../../../../components/luxesc-rich-text.js';

const FIELD_LAYOUT = {layout: 'vertical'};

/**
 * Renders catalog variable blocks (see utils/variables.js) with the OOB
 * controls factory. Values live in the page; every edit is reported as
 * `luxesc-variable-form:value-changed` with {name, value, displayValue}.
 */
@customElement('luxesc-variable-form')
export class VariableForm extends AIUXElement {
  @property({type: Array}) blocks = [];
  @property({type: Object}) values = {};
  @property({type: Object}) displayValues = {};
  @property({type: Array}) invalid = [];
  @property({type: Boolean}) disabled = false;

  // One handler per variable, so controls keep a stable callback across renders
  _handlers = new Map();

  static styles = css`
    :host {
      display: block;
    }
  `;

  _handlerFor(name) {
    if (!this._handlers.has(name)) {
      this._handlers.set(name, e => {
        const {value, displayValue} = e.detail || {};
        this.dispatchEvent(
          new CustomEvent('luxesc-variable-form:value-changed', {
            detail: {name, value, displayValue},
            bubbles: true,
            composed: true
          })
        );
      });
    }
    return this._handlers.get(name);
  }

  // A variable is not a dictionary field, so the reference control looks the
  // target table up by its own sys_id column instead (reference qualifiers are
  // not applied: the controls factory does not forward an additional qualifier)
  _lookupFor(field) {
    if (!field.reference) return {};
    return {
      name: 'sys_id',
      tableName: field.reference,
      overrideReferenceTable: field.reference,
      recordSysId: '-1'
    };
  }

  _renderField(field) {
    const isInvalid = this.invalid.includes(field.name);
    const control = {
      ...field,
      ...this._lookupFor(field),
      value: this.values[field.name] ?? field.value,
      displayValue: this.displayValues[field.name] ?? field.displayValue,
      readonly: field.readonly || this.disabled,
      isInvalid,
      messages: isInvalid
        ? [{type: 'error', message: i18n.getMessage('{0} is required', field.label)}]
        : []
    };
    return html`<div class="w-full">
      ${createFormControl(control, FIELD_LAYOUT, this._handlerFor(field.name))}
    </div>`;
  }

  _renderBlock(block) {
    switch (block.kind) {
      case 'field':
        return this._renderField(block.field);
      case 'text':
        return html`<div class="max-w-full break-words text-sm text-text-secondary">
          ${block.html
            ? html`<luxesc-rich-text .label=${block.label} .value=${block.html}></luxesc-rich-text>`
            : html`<p class="font-medium text-text-primary">${block.label}</p>`}
        </div>`;
      case 'section':
        return html`<fieldset class="flex flex-col gap-4 rounded-box border border-base-300 p-4">
          ${block.label
            ? html`<legend class="px-1 font-semibold">${block.label}</legend>`
            : nothing}
          ${block.blocks.map(child => this._renderBlock(child))}
        </fieldset>`;
      case 'unsupported':
        return html`<div class="aiux-alert aiux-alert-info aiux-alert-soft text-sm">
          ${i18n.getMessage(
            '"{0}" is not available in this portal yet. Add details in the comments after you submit.',
            block.label
          )}
        </div>`;
      default:
        return nothing;
    }
  }

  render() {
    return html`<div class="flex flex-col gap-4">
      ${this.blocks.map(block => this._renderBlock(block))}
    </div>`;
  }
}
