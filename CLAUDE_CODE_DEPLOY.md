# Deploy from Claude Code

Give Claude Code this folder/ZIP and paste this instruction:

> Deploy this existing vanilla JavaScript + Vercel Functions app to a new GitHub repository and Vercel project. Do not rewrite the app or expose secrets in source code. Run `npm test` and `npm run check` first. Push the repository to GitHub, deploy it to Vercel, then stop and tell me exactly where to add the `DISCOGS_TOKEN` environment variable in Vercel. After I add it, redeploy and verify `/api/status` returns `{"ok":true,"tokenConfigured":true}` without exposing the token. Do not print, log, commit, or echo my token.

After Claude Code gives you the Vercel project URL:

1. Open the project in Vercel.
2. Go to Settings > Environment Variables.
3. Add `DISCOGS_TOKEN` and paste your Discogs personal access token as the value.
4. Apply it to Production. Preview and Development are optional but useful.
5. Redeploy the project.
6. Visit the app and confirm the header says `Discogs token connected`.
7. In iPhone Safari, Share > Add to Home Screen.
