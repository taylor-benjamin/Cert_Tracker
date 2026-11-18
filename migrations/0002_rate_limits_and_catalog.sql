-- Failed login / signup counters for rate limiting. key looks like 'login-email:a@b.com' or 'login-ip:1.2.3.4'
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL -- unix seconds
);

-- Shared certification catalog, edited by admins. Empty means the app's built-in list is used.
CREATE TABLE certifications (
  id         TEXT PRIMARY KEY,
  position   INTEGER NOT NULL,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
