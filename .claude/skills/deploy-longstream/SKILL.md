---
name: deploy-longstream
description: Deploy the Longstream gin website to production at longstream.nz. Use when the user asks to deploy, push live, ship, or update the longstream server. Covers commit → push → SSH pull → restart → verify, including native-module rebuilds and reboot recovery.
---

# Deploy the Longstream website to longstream.nz

Production is an AWS EC2 Ubuntu box. The app is a plain Express/Pug server run with
`node src/server.js` on **port 3322**, behind **nginx** (`server_name longstream.nz`
→ `proxy_pass http://localhost:3322`). Deploy = push to GitHub, pull on the server,
restart the node process.

## Connection facts

- **SSH:** `ssh -i C:/Projects/server_key.pem ubuntu@longstream.nz` (key is machine-specific to Ben's PC).
- **App dir:** `/var/www/longstream-website` — **owned by root**, so git/npm there need `sudo`.
- **Run user:** the node process runs as **ubuntu**, not root.
- **Process manager:** none (no pm2/forever/systemd). The app is a detached `nohup` process.
  It does **NOT survive a reboot** — after any instance reboot you must start it manually (see Recovery).
- **App log:** `/home/ubuntu/longstream.log`
- **Node:** v20 on the server. Native modules (e.g. `better-sqlite3`) must be built/rebuilt
  **on the server** — never copy a local binary up.
- **Repo:** remote `origin` = `github.com/lex-dev-agent/longstream-website`, branch `main`.

## CRITICAL: how to run SSH here (avoid lockout)

The deploy SSH hangs because the detached node keeps the SSH channel open, and this tool
auto-backgrounds long calls. **Do not fire many SSH calls in quick succession** — repeated
connects trip the server's throttling/fail2ban and can lock your IP out of **both** 22 and 443.

Rules:
1. **One SSH connection at a time.** Wait for each to finish before the next.
2. **Wrap every SSH in `timeout`** (e.g. `timeout 30 ssh ...`). An `exit code 124` from a
   restart command is EXPECTED and harmless — the node started and detached; `timeout` just
   killed the lingering client. Verify success via a separate read-only check, not the exit code.
3. **Start node and verify on separate connections.** The start call won't return cleanly.
4. If SSH starts timing out at "banner exchange" / "connection refused", you're likely
   throttled — stop, wait, and verify the site from a different network instead (the live
   site on 443 is independent of your SSH access).

## Standard deploy

1. **Commit & push** (root-level `*.pdf` is gitignored — keep customer briefs out):
   ```bash
   cd /c/Projects/longstream-website
   git add -A && git commit -m "..." && git push origin main
   ```

2. **Pull + restart on the server** (single timeout-wrapped call; note `HOME=/home/ubuntu`
   so git uses ubuntu's stored credentials even under sudo):
   ```bash
   cd /c/Projects
   timeout 30 ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz '
     APP=/var/www/longstream-website
     sudo -n env HOME=/home/ubuntu git -C $APP pull --ff-only origin main 2>&1 | tail -2
     sudo -n fuser -k 3322/tcp 2>/dev/null; sleep 1
     cd $APP && setsid nohup node src/server.js > /home/ubuntu/longstream.log 2>&1 < /dev/null &
     sleep 4
     tail -3 /home/ubuntu/longstream.log
   '
   ```
   Expect the log to end with `Longstream Distillery site running on http://localhost:3322`.
   If the log shows a stack trace, the app crashed — see Troubleshooting.

3. **Verify** (separate connection + external):
   ```bash
   timeout 20 ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz \
     'echo "LOCAL: $(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3322/)"'
   curl -s -o /dev/null -w "live: %{http_code}\n" https://longstream.nz/
   ```

## When dependencies changed (package.json / package-lock)

Run an install **before** restarting. Native modules need a real build:
```bash
timeout 240 ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz '
  cd /var/www/longstream-website
  sudo -n npm install --omit=dev 2>&1 | tail -15
  # if a native module fails to load, force a from-source rebuild (build tools are present):
  sudo -n npm rebuild better-sqlite3 --foreground-scripts 2>&1 | tail -15
  node -e "require(\"better-sqlite3\"); console.log(\"LOAD_OK\")"
'
```
Do this in its own call and confirm `LOAD_OK` before restarting node. (A from-source
`better-sqlite3` build takes 1–3 min.)

## Recovery: site is down / after a reboot

Because there's no auto-start, a reboot leaves nginx up but node down (site 502/unreachable).
Restore by starting node:
```bash
# 1. read-only diagnostic first (returns quickly — no node start):
timeout 20 ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz '
  APP=/var/www/longstream-website
  echo "NODE: $(ps -eo cmd | grep "node src/server.js" | grep -v grep | head -1 || echo NONE)"
  echo "NGINX: $(systemctl is-active nginx)"
  echo "SQLITE: $(node -e "require(\"$APP/node_modules/better-sqlite3\");console.log(\"ok\")" 2>&1 | tail -1)"
  echo "HEAD: $(git -C $APP log --oneline -1)"
  tail -15 /home/ubuntu/longstream.log
'
# 2. then start node (Standard deploy step 2, skipping the git pull).
```

## Troubleshooting startup crashes (from the app log)

- **`ERR_REQUIRE_ESM` for `marked`** — `marked` is ESM-only; it must be loaded via dynamic
  `import()`, never top-level `require()`. (Already fixed in code; don't reintroduce a require.)
- **`better-sqlite3` "Could not locate the bindings file" / no `.node`** — the native binary
  is missing (often a half-finished `npm install`). Run `npm rebuild better-sqlite3`
  (see dependencies section). The code is defensive: if the DB can't load, the site still
  runs and signups fall back to the log (`CLUB_SIGNUP_FALLBACK ...`).

## Club signups (SQLite)

Stored at `/home/ubuntu/.longstream/club-signups.db`. Read them:
```bash
timeout 20 ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz \
 'node -e "const o=require(\"os\"),p=require(\"path\"),D=require(\"/var/www/longstream-website/node_modules/better-sqlite3\");const db=new D(p.join(o.homedir(),\".longstream\",\"club-signups.db\"),{readonly:true});console.log(JSON.stringify(db.prepare(\"SELECT email,variant,created_at FROM club_signups ORDER BY id\").all(),null,2))"'
```

## Notes / known gaps

- **reCAPTCHA** uses Google's always-pass TEST keys in production until real keys are set as
  `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` env vars (the app does not load a `.env`,
  so they must be exported in the process environment / start command).
- No reboot auto-start yet — consider a systemd service or `@reboot` cron if this recurs.
