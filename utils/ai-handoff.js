/**
 * Carries an assistant's prefill across a page change. A client tool that
 * navigates ends the assistant's turn before the next page registers its own
 * tools, so the catalog hands the proposed answers to the item page here.
 * Session storage keeps it per tab; it is a convenience, so failures are ignored.
 */
const KEY = 'luxesc.prefill';

export function stashPrefill(itemId, prefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({itemId, ...prefill}));
  } catch {
    // Storage unavailable: the employee fills the form, or asks again on the item page
  }
}

export function takePrefill(itemId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!stored || stored.itemId !== itemId) return null;
    sessionStorage.removeItem(KEY);
    return stored;
  } catch {
    return null;
  }
}
