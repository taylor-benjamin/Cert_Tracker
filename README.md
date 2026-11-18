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

### Auto-deploy

Every push to `main` runs `.github/workflows/deploy-cloudflare.yml`. It applies
new migrations to the live database, then deploys the Worker. It needs a
`CLOUDFLARE_API_TOKEN` repository secret with **Workers Scripts: Edit** and
**D1: Edit** permissions.

### Making someone an admin

Admins edit the shared certification list (the Admin tab is hidden for everyone
else). After that person signs up:

```sh
npx wrangler d1 execute certtracker --remote --command "UPDATE users SET role='admin' WHERE email='you@example.com'"
```

They need to log out and back in to see the Admin tab.

### Local development

```sh
npm run db:migrate:local
npm run dev                           # http://localhost:8787
```

### Layout

| Path | What it is |
|---|---|
| `worker/index.js` | API: accounts, password change, rate limits, data sync, admin catalog |
| `migrations/` | D1 schema (`wrangler d1 migrations create certtracker <name>` adds one) |
| `js/state.js` | Front end store. Uses the API when it's there, otherwise the browser |
| `.assetsignore` | Keeps the worker code and config from being served as public files |

Goals, study sessions and quiz attempts each have their own table. Everything
else in the app state (theme, badges, certifications, sprint hub) is saved as
one JSON settings row per user.

### Security notes

- Passwords are hashed with PBKDF2 (100k rounds). Sessions are HttpOnly cookies
  that last 30 days.
- Failed logins are limited to 10 per account and 30 per IP every 15 minutes.
  Signups are limited to 10 per IP per hour.
- Changing your password signs out every other device.
- Password reset by email isn't built yet; it needs an email service.
