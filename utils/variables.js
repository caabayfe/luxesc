import {FieldType} from '@servicenow/aiux/aiux-components-control';
import {i18n} from '@servicenow/aiux/aiux-services';

// Maps Service Catalog API variables (item_option_new) onto the OOB Lux form
// controls. This stands in for the standalone mode of aiux-catalog-form, which
// AIUX has not shipped yet; retire this module once it is available.

// item_option_new.type
const VARIABLE_TYPE = {
  YES_NO: 1,
  MULTI_LINE_TEXT: 2,
  MULTIPLE_CHOICE: 3,
  NUMERIC_SCALE: 4,
  SELECT_BOX: 5,
  SINGLE_LINE_TEXT: 6,
  CHECKBOX: 7,
  REFERENCE: 8,
  DATE: 9,
  DATE_TIME: 10,
  LABEL: 11,
  BREAK: 12,
  MACRO: 14,
  UI_PAGE: 15,
  WIDE_SINGLE_LINE_TEXT: 16,
  MACRO_WITH_LABEL: 17,
  LOOKUP_SELECT_BOX: 18,
  CONTAINER_START: 19,
  CONTAINER_END: 20,
  LIST_COLLECTOR: 21,
  LOOKUP_MULTIPLE_CHOICE: 22,
  HTML: 23,
  CONTAINER_SPLIT: 24,
  MASKED: 25,
  EMAIL: 26,
  URL: 27,
  IP_ADDRESS: 28,
  DURATION: 29,
  REQUESTED_FOR: 31,
  RICH_TEXT_LABEL: 32,
  ATTACHMENT: 33
};

const CONTROL_TYPE = {
  [VARIABLE_TYPE.YES_NO]: FieldType.Choice,
  [VARIABLE_TYPE.MULTI_LINE_TEXT]: FieldType.Textarea,
  [VARIABLE_TYPE.MULTIPLE_CHOICE]: FieldType.Radio,
  [VARIABLE_TYPE.NUMERIC_SCALE]: FieldType.Radio,
  [VARIABLE_TYPE.SELECT_BOX]: FieldType.Choice,
  [VARIABLE_TYPE.SINGLE_LINE_TEXT]: FieldType.String,
  [VARIABLE_TYPE.CHECKBOX]: FieldType.Boolean,
  [VARIABLE_TYPE.REFERENCE]: FieldType.Reference,
  [VARIABLE_TYPE.DATE]: FieldType.Date,
  [VARIABLE_TYPE.DATE_TIME]: FieldType.DateTime,
  [VARIABLE_TYPE.WIDE_SINGLE_LINE_TEXT]: FieldType.String,
  [VARIABLE_TYPE.LOOKUP_SELECT_BOX]: FieldType.Choice,
  [VARIABLE_TYPE.LIST_COLLECTOR]: FieldType.GlideList,
  [VARIABLE_TYPE.LOOKUP_MULTIPLE_CHOICE]: FieldType.Radio,
  [VARIABLE_TYPE.HTML]: FieldType.Html,
  [VARIABLE_TYPE.MASKED]: FieldType.Password,
  [VARIABLE_TYPE.EMAIL]: FieldType.Email,
  [VARIABLE_TYPE.URL]: FieldType.Url,
  [VARIABLE_TYPE.IP_ADDRESS]: FieldType.IpAddress,
  [VARIABLE_TYPE.DURATION]: FieldType.String,
  [VARIABLE_TYPE.REQUESTED_FOR]: FieldType.Reference
};

// Layout-only variables carry no value
const LAYOUT_TYPES = new Set([
  VARIABLE_TYPE.BREAK,
  VARIABLE_TYPE.CONTAINER_END,
  VARIABLE_TYPE.CONTAINER_SPLIT
]);

// Variables that need catalog client-side machinery the PoC does not emulate
const UNSUPPORTED_TYPES = new Set([
  VARIABLE_TYPE.MACRO,
  VARIABLE_TYPE.UI_PAGE,
  VARIABLE_TYPE.MACRO_WITH_LABEL,
  VARIABLE_TYPE.ATTACHMENT
]);

function isTrue(value) {
  return value === true || value === 'true';
}

function toChoices(variable) {
  if (Number(variable.type) === VARIABLE_TYPE.YES_NO) {
    return [
      {value: 'Yes', displayValue: i18n.getMessage('Yes')},
      {value: 'No', displayValue: i18n.getMessage('No')}
    ];
  }
  return (variable.choices || []).map(choice => ({
    value: String(choice.value ?? ''),
    displayValue: choice.label ?? String(choice.value ?? '')
  }));
}

function toField(variable) {
  const type = Number(variable.type);
  const controlType = CONTROL_TYPE[type];
  if (!controlType) return null;

  const value = variable.value ?? '';
  const field = {
    name: variable.name,
    label: variable.label || variable.name,
    type: controlType,
    value: controlType === FieldType.Boolean ? isTrue(value) : value,
    displayValue: variable.displayvalue ?? value,
    visible: true,
    readonly: isTrue(variable.read_only),
    mandatory: isTrue(variable.mandatory),
    fieldHint: variable.help_text || variable.instructions || ''
  };

  if (
    controlType === FieldType.Choice ||
    controlType === FieldType.Radio
  ) {
    field.choices = toChoices(variable);
  }

  if (
    controlType === FieldType.Reference ||
    controlType === FieldType.GlideList
  ) {
    field.reference =
      variable.reference ||
      variable.list_table ||
      (type === VARIABLE_TYPE.REQUESTED_FOR ? 'sys_user' : '');
    field.referenceQualifier = variable.ref_qualifier || '';
    field.multiSelection = controlType === FieldType.GlideList;
  }

  return field;
}

/**
 * Turns the API's variable list into render blocks:
 * - {kind: 'field', field}
 * - {kind: 'text', label, html}         labels and rich-text labels
 * - {kind: 'section', label, blocks}    containers
 * - {kind: 'unsupported', label}        macros, UI pages, attachment variables
 */
export function toBlocks(variables = []) {
  const blocks = [];
  const sorted = [...variables].sort(
    (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)
  );

  for (const variable of sorted) {
    const type = Number(variable.type);
    if (LAYOUT_TYPES.has(type)) continue;
    // Hidden on the order form; only shown on the requested item
    if (
      variable.visible_standalone !== undefined &&
      !isTrue(variable.visible_standalone)
    ) {
      continue;
    }

    if (type === VARIABLE_TYPE.CONTAINER_START) {
      const children = toBlocks(variable.children || []);
      if (children.length) {
        blocks.push({kind: 'section', label: variable.label || '', blocks: children});
      }
      continue;
    }

    if (type === VARIABLE_TYPE.LABEL || type === VARIABLE_TYPE.RICH_TEXT_LABEL) {
      blocks.push({
        kind: 'text',
        label: variable.label || '',
        html: variable.rich_text || variable.displayvalue || ''
      });
      continue;
    }

    if (UNSUPPORTED_TYPES.has(type)) {
      blocks.push({kind: 'unsupported', label: variable.label || variable.name});
      continue;
    }

    const field = toField(variable);
    if (field) blocks.push({kind: 'field', field});
  }

  return blocks;
}

export function collectFields(blocks) {
  return blocks.flatMap(block => {
    if (block.kind === 'field') return [block.field];
    if (block.kind === 'section') return collectFields(block.blocks);
    return [];
  });
}

function isEmpty(value) {
  return value === undefined || value === null || value === '' || value === false;
}

export function missingMandatory(fields, values) {
  return fields.filter(
    field => field.mandatory && !field.readonly && isEmpty(values[field.name])
  );
}

// The catalog API expects every variable value as a string
export function toSubmission(fields, values) {
  const variables = {};
  for (const field of fields) {
    const value = values[field.name];
    if (value === undefined || value === null) continue;
    variables[field.name] = String(value);
  }
  return variables;
}
