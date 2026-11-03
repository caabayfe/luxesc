import {navigate} from '@servicenow/aiux/aiux-client';
import {fetchItem, fetchItems} from './api.js';
import {describeFields} from './ai-form.js';
import {stashPrefill} from './ai-handoff.js';
import {collectFields, toBlocks} from './variables.js';
import {SERVICE_CATALOG_ID} from '../constants/catalog.js';

/**
 * Client tools that let the Now Assist chat take an employee from a need to a
 * pre-filled order form on any page: find the item, read its form, open it
 * with the answers. None of them submits anything; the employee does.
 */

const SYS_ID = /^[0-9a-f]{32}$/;

function bestMatch(items, name) {
  const wanted = String(name || '').trim().toLowerCase();
  return (
    items.find(item => item.name.toLowerCase() === wanted) ||
    items.find(item => wanted && item.name.toLowerCase().includes(wanted)) ||
    items[0]
  );
}

export const catalogTools = {
  prepare_catalog_order: {
    description:
      'One step from a need to a pre-filled order form: searches the catalog (only items this employee may order), picks the best match, and opens its form pre-filled. Use it only when the employee asks to request or order one thing; prefer it over desktop or web actions. Never use it when something is broken or not working (the Fix something broken skill) or for several items at once (the Order several items at once skill). Never submits.',
    arguments: [
      {name: 'search', description: 'Keywords for the item, e.g. "standard laptop"', type: 'string', required: true},
      {name: 'itemName', description: 'Exact item name if the employee named one', type: 'string', required: false},
      {name: 'quantity', description: 'Number of items, if said', type: 'number', required: false},
      {
        name: 'values',
        description: 'Object of answers keyed by what they are about (e.g. {"software": "Visual Studio Code"})',
        type: 'object',
        required: false
      },
      {name: 'details', description: 'Anything else the employee said that belongs on the form', type: 'string', required: false}
    ],
    definition: async function ({search, itemName, quantity, values, details} = {}) {
      const items = await fetchItems({catalogId: SERVICE_CATALOG_ID, text: itemName || search, limit: 5}).catch(() => []);
      const item = items?.length ? bestMatch(items, itemName) : null;
      if (!item) return {success: false, reason: `No catalog item matches "${itemName || search}"`};
      stashPrefill(item.sys_id, {values, quantity, details});
      navigate(`/catalog/${item.sys_id}`);
      return {
        success: true,
        opened: item.name,
        alternatives: items.filter(other => other !== item).map(other => other.name),
        nextStep: `The ${item.name} form is open and pre-filled. Ask the employee to review it, complete anything missing, and press the request button.`
      };
    }
  },

  find_catalog_items: {
    description:
      'Search the service catalog (only items this employee may order). Returns up to 5 items with their sysId. Prefer this over desktop or web actions.',
    arguments: [
      {name: 'text', description: 'What the employee needs, in a few keywords', type: 'string', required: true}
    ],
    definition: async function ({text} = {}) {
      const items = await fetchItems({catalogId: SERVICE_CATALOG_ID, text, limit: 5}).catch(() => []);
      return {
        success: true,
        items: (items || []).map(item => ({
          sysId: item.sys_id,
          name: item.name,
          shortDescription: item.short_description,
          category: item.category?.title,
          price: item.show_price ? item.price : undefined
        }))
      };
    }
  },
  describe_catalog_item: {
    description:
      'Read the order form of a catalog item: its variables (name, label, type, mandatory, choices) so you can work out the values from what the employee said.',
    arguments: [
      {name: 'sysId', description: 'Catalog item sys_id from find_catalog_items', type: 'string', required: true}
    ],
    definition: async function ({sysId} = {}) {
      if (!SYS_ID.test(String(sysId))) return {success: false, reason: 'sysId must be a catalog item sys_id'};
      const item = await fetchItem(sysId).catch(() => null);
      if (!item) return {success: false, reason: 'This item is not available to the employee'};
      return {
        success: true,
        name: item.name,
        takesQuantity: Boolean(item.show_quantity),
        fields: describeFields(collectFields(toBlocks(item.variables || [])), {})
      };
    }
  },
  open_catalog_item: {
    description:
      'Open the order form of a catalog item, pre-filled with values and quantity. The employee reviews it and presses the request button; never claim it was submitted.',
    arguments: [
      {name: 'sysId', description: 'Catalog item sys_id', type: 'string', required: true},
      {
        name: 'values',
        description: 'Optional object mapping variable name or label to a value, from what the employee already said',
        type: 'object',
        required: false
      },
      {name: 'quantity', description: 'Optional number of items', type: 'number', required: false}
    ],
    definition: async function ({sysId, values, quantity} = {}) {
      if (!SYS_ID.test(String(sysId))) return {success: false, reason: 'sysId must be a catalog item sys_id'};
      if (values || quantity) stashPrefill(String(sysId), {values, quantity});
      navigate(`/catalog/${sysId}`);
      return {
        success: true,
        nextStep: 'The form is open and pre-filled. Ask the employee to review it, complete anything missing, and press the request button.'
      };
    }
  }
};
