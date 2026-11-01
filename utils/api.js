import {aiuxFetch} from '@servicenow/aiux/aiux-components-core';

// Only OOB platform APIs: the Service Catalog API applies user criteria and the
// Table API applies ACLs, so the portal never sees more than the employee may.
const CATALOG_API = '/api/sn_sc/servicecatalog';
const TABLE_API = '/api/now/table';

// aiuxFetch carries the session on the server (SSR loaders) and adds the XSRF token in the browser
async function request(url, {method = 'GET', body} = {}) {
  const response = await aiuxFetch(url, {
    method,
    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      json.error?.message || `HTTP error ${response.status}`
    );
    error.detail = json.error?.detail || '';
    error.status = response.status;
    throw error;
  }
  return json.result;
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export function fetchCategories(catalogId) {
  return request(
    `${CATALOG_API}/catalogs/${catalogId}/categories?${query({
      sysparm_top_level_only: true,
      sysparm_limit: 50
    })}`
  );
}

export function fetchItems({catalogId, categoryId, text, limit, offset}) {
  return request(
    `${CATALOG_API}/items?${query({
      sysparm_catalog: catalogId,
      sysparm_category: categoryId,
      sysparm_text: text,
      sysparm_limit: limit,
      sysparm_offset: offset
    })}`
  );
}

export function fetchItem(itemId) {
  return request(`${CATALOG_API}/items/${itemId}`);
}

export function orderNow(itemId, {quantity, variables}) {
  return request(`${CATALOG_API}/items/${itemId}/order_now`, {
    method: 'POST',
    body: {sysparm_quantity: String(quantity), variables}
  });
}

export function submitProducer(itemId, {variables}) {
  return request(`${CATALOG_API}/items/${itemId}/submit_producer`, {
    method: 'POST',
    body: {variables}
  });
}

export function fetchRecords(table, {encodedQuery, fields, limit = 10}) {
  return request(
    `${TABLE_API}/${table}?${query({
      sysparm_query: encodedQuery,
      sysparm_fields: fields,
      sysparm_limit: limit,
      sysparm_display_value: 'all',
      sysparm_exclude_reference_link: true
    })}`
  );
}

export async function fetchRecord(table, sysId, fields) {
  const records = await fetchRecords(table, {
    encodedQuery: `sys_id=${sysId}`,
    fields,
    limit: 1
  });
  return records?.[0] || null;
}

// The catalog API returns image paths relative to the instance root
// Journal entry visible to the requester and the fulfillers (Additional comments)
export function addComment(table, sysId, text) {
  return request(`${TABLE_API}/${table}/${sysId}?${query({sysparm_fields: 'sys_id'})}`, {
    method: 'PATCH',
    body: {comments: text}
  });
}

export function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('/') || path.startsWith('http') ? path : `/${path}`;
}
