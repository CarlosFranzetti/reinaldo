# Rey’s for sell

A mobile-first vinyl catalogue, preloaded with 38 records and backed by the
Discogs API. Inventory lives in the browser on the device that
edits it; the Discogs token stays server-side as a Vercel environment variable.

## Live deployment

Deployed on Vercel and linked to this repository, so every push to `main`
deploys automatically.

- Vercel project: `reinaldo` (team `carlosfranzettis-projects`)
- Production: https://reinaldo.vercel.app
- `DISCOGS_TOKEN` is set in Vercel's Environment Variables.

`GET /api/status` must return `{"ok":true,"tokenConfigured":true}` and never the
token itself.

The Vercel project and its URL are still named `reinaldo`; only the app's own
name changed, so existing Home Screen shortcuts keep working. The browser
storage keys are unchanged for the same reason — renaming them would orphan the
catalogue already saved on a device.

## The three screens

**Catalog** — record cards on a phone, a spreadsheet on a desktop. Search,
filter, grade, price, and open any record to research it on Discogs.

**Database** — every field of every record in one editable grid. Filter by any
column; select rows to duplicate, delete or set a grade; insert blank rows and
renumber. Edits save to the device as they are typed.

**Report** — a collection report: cover, summary with concentration by label,
schedule of holdings, holdings awaiting verification, and a basis of
preparation. Prints A4 with page numbers. It is an inventory record, not an
appraisal or a valuation.

## Adding records

- **Add → Single record** — photograph the sleeve (the camera opens directly on
  a phone), search Discogs by artist, title or catalogue number and pick the
  exact pressing, or type it in by hand.
- **Add → Many at once** — up to 20 in one pass: multi-select photos, one record
  per photo, and/or paste a list of `Artist - Title` lines, optionally looked up
  on Discogs as they are added.

Photos are downscaled to 640px JPEG and stored with the record on that device.
They are never uploaded, and they do not identify a pressing on their own.

## Pricing

Each record carries one **Price**, set at **15% below its high**
(`PRICE_DISCOUNT` in `data/catalog.js`). The high is, in order of preference:

1. Discogs' condition-based price suggestion;
2. a high entered by hand;
3. an estimate — the lowest currently-listed price multiplied by a factor set
   under **Discogs → Pricing basis…** (default 3).

Only the first two are market figures. The third is an assumption: records
priced that way record the fact, the calculate summary counts them, and the
report's schedule carries a **Price basis** column.

> Discogs withholds condition-based suggestions until an account has completed
> its seller settings, returning *"You must fill out your seller settings
> first."* Until that is done at discogs.com/settings/seller, every high comes
> from the estimate above.

Set the multiple to 0 to leave un-suggested records blank instead.

## Refreshing from Discogs

- **Rebuild everything** — the server walks the seed catalogue through
  `/api/enrich` in slices, so the phone makes about seven requests instead of
  roughly 150. It replaces local edits, prices and photos, so back up first.
- **Refresh the records I have** — updates the records already in the catalogue
  in place, from the device, keeping everything else.
- **Calculate all fields** — fills prices from the rule above, defaults missing
  grades to VG+, marks complete records resolved, and reports the total.

Matching is deliberately conservative: a record links only on an exact
catalogue number (containment counts, so `KR005 / KRESEARCH 005` matches
`KR005`) or when both artist and title appear in the release title. Anything
less certain is left unlinked rather than filled with the wrong pressing.

## Export and backup

Collection report (PDF), for-sale list (copy / .xls / print), Excel
spreadsheet, and **Backup JSON** — which **Restore from backup…** reads back.

## API

- `GET /api/status`
- `GET /api/search?q=artist%20title`
- `GET /api/release/:id`
- `GET /api/marketplace/:id` — marketplace stats plus condition-based price
  suggestions; the suggestions call is best-effort and never fails the request
- `GET /api/enrich?start=0&count=6` — server-side enrichment of the seed
  catalogue, returned in slices

## Security

Never commit the token. It belongs only in Vercel's Environment Variables or a
local ignored `.env`. It is not referenced from `app.js`, `vercel.json`,
`.env.example`, any export, or any response body.

## Local development

```bash
npm test          # 15 tests
npm run check     # syntax-check every source file
export DISCOGS_TOKEN='your-token'
npm start         # http://127.0.0.1:4173
```

`server.mjs` serves the same static files as Vercel and implements the same API
locally. It serves only known asset types and refuses dotfiles, so `.env` and
the server sources are never exposed.
