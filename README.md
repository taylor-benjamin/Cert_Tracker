# CertTracker

Live demo (browser storage only): https://taylor-benjamin.github.io/Cert_Tracker/

## Cloudflare (accounts + D1 database)

The same files also run on Cloudflare Workers. A Worker in `worker/` serves the
site and an `/api` backed by a D1 (SQLite) database, so accounts and data sync
across devices. It runs on a free `*.workers.dev` address, no domain needed.

Without the API (for example on GitHub Pages) the app falls back to saving in
the browser, as before.

### First deploy

```sh
npm install
npx wrangler login                    # opens a browser to sign in to Cloudflare
npx wrangler d1 create certtracker    # copy the database_id it prints into wrangler.jsonc
npm run db:migrate:remote             # creates the tables
npm run deploy                        # prints your https://certtracker.<you>.workers.dev URL
```

### Local development

```sh
npm run db:migrate:local
npm run dev                           # http://localhost:8787
```

### Layout

| Path | What it is |
|---|---|
| `worker/index.js` | API: sign up, log in, log out, load state, sync changes |
| `migrations/` | D1 schema (`wrangler d1 migrations create certtracker <name>` adds one) |
| `js/state.js` | Front end store. Uses the API when it's there, otherwise the browser |
| `.assetsignore` | Keeps the worker code and config from being served as public files |

Goals, study sessions and quiz attempts each have their own table. Everything
else in the app state (theme, badges, certifications, sprint hub) is saved as
one JSON settings row per user.
