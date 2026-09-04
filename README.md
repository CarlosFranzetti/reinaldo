# Carlos Discogs Vinyl Collector, Phone/Vercel Edition

A mobile-first personal vinyl catalog preloaded with Carlos's 38 records. The browser stores inventory edits locally on the phone. Discogs credentials stay server-side as a Vercel environment variable.

## What is included

- iPhone-friendly record cards plus desktop spreadsheet view
- Discogs release search and exact pressing selection
- Release metadata, track list, labels, catalog numbers, country and year
- Marketplace `num_for_sale` and lowest-price data when Discogs returns it
- Goldmine-style media and sleeve grading
- Amber verification state for unresolved records
- `.xls` export, JSON backup and browser Print/PDF
- Add-to-Home-Screen metadata for iPhone
- No Discogs token stored in frontend JavaScript, localStorage, exports, or Git

## Live deployment

The project is deployed on Vercel and linked to this GitHub repository, so
every push to `main` deploys automatically.

- Vercel project: `reinaldo` (team `carlosfranzettis-projects`)
- Production: https://reinaldo.vercel.app
- `DISCOGS_TOKEN` is configured in Vercel's Environment Variables.

Confirm a deployment is healthy with `GET /api/status`, which must return
`{"ok":true,"tokenConfigured":true}` and never the token itself.

## Deploy to Vercel

If you are setting this up from scratch:

1. Put this folder in a GitHub repository.
2. In Vercel choose **Add New > Project**, import the GitHub repository, and deploy it as an **Other** project. No build command is required.
3. Open the Vercel project, then **Settings > Environment Variables**.
4. Add `DISCOGS_TOKEN` with your Discogs personal access token. Enable Production, Preview and Development if you want all deployments to work.
5. Redeploy after adding the environment variable.
6. Open the production URL and confirm the header says **Discogs token connected**.

## iPhone Home Screen

Open the deployed URL in Safari, tap Share, choose **Add to Home Screen**, and launch the saved icon. The app runs in a standalone browser window.

## API endpoints

- `GET /api/status`
- `GET /api/search?q=artist%20title`
- `GET /api/release/:id`
- `GET /api/marketplace/:id`

## Security

Never commit your token. Do not add it to `app.js`, `vercel.json`, `.env.example`, GitHub, or screenshots. Store it only in Vercel's Environment Variables or a local ignored `.env` file.

## Local development

The older `server.mjs` still works for local Node testing:

```bash
export DISCOGS_TOKEN='your-token'
node server.mjs
```

Then visit `http://127.0.0.1:4173`.
