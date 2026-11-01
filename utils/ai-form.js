import {FieldType} from '@servicenow/aiux/aiux-components-control';
import {fetchRecords} from './api.js';

/**
 * Bridges the order form and the Now Assist chat: describes the variables to
 * the assistant and applies the values it proposes, matching the loose input
 * an LLM produces (labels, display values, "yes") to what each control takes.
 */

const TRUE_WORDS = ['true', 'yes', 'y', '1', 'on'];

const normalise = text => String(text ?? '').trim().toLowerCase();

/** Serializable summary of the form for setAiContext / tool results. */
export function describeFields(fields, values) {
  return fields.map(field => ({
    name: field.name,
    label: field.label,
    type: field.type,
    mandatory: field.mandatory,
    readonly: field.readonly,
    ...(field.choices && {
      choices: field.choices.map(choice => choice.displayValue)
    }),
    ...(field.reference && {references: field.reference}),
    ...(field.fieldHint && {hint: field.fieldHint}),
    value: values[field.name] ?? ''
  }));
}

const words = text => normalise(text).split(/[^a-z0-9]+/).filter(word => word.length > 2);

// Exact name or label first, then the field whose label shares most words with
// the key ("software" finds "Additional software requirements")
function findField(fields, key) {
  const wanted = normalise(key);
  const exact =
    fields.find(field => normalise(field.name) === wanted) ||
    fields.find(field => normalise(field.label) === wanted);
  if (exact) return exact;
  const keyWords = words(key);
  let best = null;
  let bestScore = 0;
  for (const field of fields) {
    const fieldWords = new Set([...words(field.label), ...words(field.name.replace(/_/g, ' '))]);
    const score = keyWords.filter(word => fieldWords.has(word)).length;
    if (score > bestScore) {
      best = field;
      bestScore = score;
    }
  }
  return best;
}

const FREE_TEXT = [FieldType.Textarea, FieldType.String];

/** First writable free-text field still empty, for details that fit no field. */
export function freeTextField(fields, values) {
  return fields.find(
    field => FREE_TEXT.includes(field.type) && !field.readonly && !values[field.name]
  );
}

// Reference tables almost always carry a `name` column (users, departments,
// locations, groups); a 32-char hex value is taken as a sys_id as-is. An exact
// name wins; otherwise the first match is used and the others are reported so
// the assistant can check with the employee
async function resolveReference(field, raw) {
  const text = String(raw).trim();
  if (/^[0-9a-f]{32}$/.test(text)) return {value: text, displayValue: text};
  const records = await fetchRecords(field.reference, {
    encodedQuery: `nameSTARTSWITH${text}^ORDERBYname`,
    fields: 'sys_id,name',
    limit: 5
  }).catch(() => []);
  if (!records?.length) return null;
  const record =
    records.find(candidate => normalise(candidate.name.display_value) === normalise(text)) ||
    records[0];
  const alternatives = normalise(record.name.display_value) === normalise(text)
    ? []
    : records.filter(candidate => candidate !== record).map(candidate => candidate.name.display_value);
  return {value: record.sys_id.value, displayValue: record.name.display_value, alternatives};
}

async function coerce(field, raw) {
  if (field.type === FieldType.Boolean) {
    const value = TRUE_WORDS.includes(normalise(raw));
    return {value, displayValue: String(value)};
  }
  if (field.choices) {
    const wanted = normalise(raw);
    const choice = field.choices.find(
      option =>
        normalise(option.value) === wanted ||
        normalise(option.displayValue) === wanted
    );
    return choice
      ? {value: choice.value, displayValue: choice.displayValue}
      : null;
  }
  if (field.reference && !field.multiSelection) {
    return resolveReference(field, raw);
  }
  return {value: String(raw), displayValue: String(raw)};
}

/**
 * Applies `{nameOrLabel: value}` to the form.
 * @returns {Promise<{values: object, displayValues: object, applied: string[], rejected: Array<{field: string, reason: string}>, guessed: Array<{name: string, field: string, chosen: string, alternatives: string[]}>}>}
 */
export async function applyAiValues(fields, input = {}) {
  const values = {};
  const displayValues = {};
  const applied = [];
  const rejected = [];
  const guessed = [];
  for (const [key, raw] of Object.entries(input)) {
    const field = findField(fields, key);
    if (!field) {
      rejected.push({field: key, reason: 'No such field on this form'});
      continue;
    }
    if (field.readonly) {
      rejected.push({field: key, reason: 'Field is read-only'});
      continue;
    }
    const result = await coerce(field, raw);
    if (!result) {
      rejected.push({
        field: key,
        reason: field.choices
          ? `Not one of: ${field.choices.map(choice => choice.displayValue).join(', ')}`
          : `No ${field.reference} record matches "${raw}"`
      });
      continue;
    }
    values[field.name] = result.value;
    displayValues[field.name] = result.displayValue;
    applied.push(field.label);
    if (result.alternatives?.length) {
      guessed.push({name: field.name, field: field.label, chosen: result.displayValue, alternatives: result.alternatives});
    }
  }
  return {values, displayValues, applied, rejected, guessed};
}
