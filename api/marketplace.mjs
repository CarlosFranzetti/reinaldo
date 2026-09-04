import { discogsFetch, handleError, sendJson } from './_lib/discogs.mjs';

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || '').trim();
    if (!/^\d+$/.test(id)) return sendJson(res, 400, { error: 'Invalid release id.' });
    try {
      const m = await discogsFetch(`/marketplace/stats/${id}`);
      return sendJson(res, 200, {
        available: true,
        numForSale: m.num_for_sale ?? null,
        lowestPrice: m.lowest_price ? { value: m.lowest_price.value, currency: m.lowest_price.currency } : null,
        blockedFromSale: m.blocked_from_sale ?? null
      });
    } catch (err) {
      if ([401, 403, 404].includes(err.status)) {
        return sendJson(res, 200, { available: false, reason: err.message, status: err.status });
      }
      throw err;
    }
  } catch (err) {
    return handleError(res, err);
  }
}
