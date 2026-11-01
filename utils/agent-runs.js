import {aiuxFetch} from '@servicenow/aiux/aiux-components-core';

/**
 * Client of the app's agent run API (LuxEscConcierge): starts the portal's AI
 * agents for the signed-in employee and reads their progress and result.
 */
export const RUNS_API = '/api/x_everi_luxesc/v1/concierge';
export const POLL_MS = 2500;
// An agent run that is still going after this long is reported as stuck
export const GIVE_UP_MS = 4 * 60 * 1000;

export async function callRuns(path, {method = 'GET', body} = {}) {
  const response = await aiuxFetch(`${RUNS_API}${path}`, {
    method,
    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    body: method === 'POST' ? JSON.stringify(body || {}) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message || `HTTP error ${response.status}`);
  return json.result?.run || null;
}
