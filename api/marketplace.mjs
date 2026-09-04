import { discogsFetch, handleError, sendJson } from './_lib/discogs.mjs';

// Marketplace stats only carry the lowest listed price. Condition-based price
// suggestions give the high end of the range, but they are not available for
// every release or every account, so a failure here must never fail the request.
async function priceSuggestions(id) {
  try {
    const raw = await discogsFetch(`/marketplace/price_suggestions/${id}`);
    const entries = Object.entries(raw || {})
      .map(([condition, v]) => (v && Number.isFinite(Number(v.value))
        ? { condition, value: Number(v.value), currency: v.currency || '' }
        : null))
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
    if (!entries.length) {
      return { suggestions: [], highest: null, suggestionsReason: 'Discogs returned no price suggestions for this release.' };
    }
    return { suggestions: entries, highest: entries[0], suggestionsReason: null };
  } catch (err) {
    return { suggestions: [], highest: null, suggestionsReason: err.message || 'Price suggestions unavailable.' };
  }
}

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || '').trim();
    if (!/^\d+$/.test(id)) return sendJson(res, 400, { error: 'Invalid release id.' });
    const priced = await priceSuggestions(id);
    try {
      const m = await discogsFetch(`/marketplace/stats/${id}`);
      return sendJson(res, 200, {
        available: true,
        numForSale: m.num_for_sale ?? null,
        lowestPrice: m.lowest_price ? { value: m.lowest_price.value, currency: m.lowest_price.currency } : null,
        blockedFromSale: m.blocked_from_sale ?? null,
        ...priced
      });
    } catch (err) {
      if ([401, 403, 404].includes(err.status)) {
        return sendJson(res, 200, { available: false, reason: err.message, status: err.status, ...priced });
      }
      throw err;
    }
  } catch (err) {
    return handleError(res, err);
  }
}
