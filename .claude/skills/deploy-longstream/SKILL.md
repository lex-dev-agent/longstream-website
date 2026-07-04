---
name: deploy-longstream
description: Deploy the Longstream gin website to production at longstream.nz. Use when the user asks to deploy, push live, ship, or update the longstream server. One-command flow via scripts/deploy.sh; app runs under systemd.
---

# Deploy the Longstream website to longstream.nz

Production is an AWS EC2 Ubuntu box. The app is an Express/Pug server on **port 3322**
behind **nginx** (`longstream.nz` → `proxy_pass http://localhost:3322`), managed by
**systemd** (`longstream.service`).

## The fast path (use this)

```bash
bash scripts/deploy.sh "commit message"
```
~5 seconds. It: commits working-tree changes → pushes → pulls on the server → restarts the
service **only if `src/**.js` or `package*.json` changed** (template/CSS/image changes go live
on the pull with **no restart = zero downtime**) → prints `status: active`.

That's the whole flow for a normal change. The sections below are reference/troubleshooting.

## Connection facts

- **SSH:** `ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz` (key is machine-specific to Ben's PC; override with `LONGSTREAM_KEY`).
- **App dir:** `/var/www/longstream-website` — **root-owned**, so git there needs `sudo` (and `env HOME=/home/ubuntu` so git finds ubuntu's stored credentials).
- **Service:** `longstream.service` — runs `node src/server.js` as **ubuntu** on port 3322.
  - `sudo systemctl restart longstream` — instant, returns immediately (no SSH hang).
  - `systemctl status longstream` / `is-active` / `is-enabled`.
  - **Enabled = auto-starts on reboot and auto-restarts on crash** (`Restart=on-failure`).
- **Logs:** `journalctl -u longstream -n 50` or `/home/ubuntu/longstream.log`.
- **Node:** `/usr/bin/node` (v20). Native modules (better-sqlite3) must be built **on the server**.
- **View cache:** off (no `NODE_ENV=production`), so `.pug` changes take effect on pull with no restart.
- **Repo:** `origin` = `github.com/lex-dev-agent/longstream-website`, branch `main`. Root-level `*.pdf` is gitignored.

## Manual deploy (if not using the script)

```bash
git add -A && git commit -m "..." && git push origin main
ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz '
  sudo -n env HOME=/home/ubuntu git -C /var/www/longstream-website pull --ff-only origin main
  sudo -n systemctl restart longstream          # omit for template/CSS/image-only changes
  systemctl is-active longstream
'
curl -s -o /dev/null -w "live: %{http_code}\n" https://longstream.nz/
```

## SSH hygiene

- **Don't fire many SSH calls in quick succession** — repeated connects can trip the server's
  throttling/fail2ban and lock your IP out of **both** 22 and 443. One connection at a time.
- With systemd the restart returns immediately — the old `nohup`-based hang / `timeout` / `exit 124`
  workarounds are no longer needed.
- If SSH starts timing out ("banner exchange" / "connection refused"), you're likely throttled
  or the box is mid-boot — wait, and check the live site on 443 (independent of SSH).

## When dependencies change (package.json / package-lock)

```bash
ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz '
  cd /var/www/longstream-website
  sudo -n npm install --omit=dev
  # if a native module fails to load, force a from-source rebuild (build tools are present):
  sudo -n npm rebuild better-sqlite3 --foreground-scripts
  node -e "require(\"better-sqlite3\"); console.log(\"LOAD_OK\")"
  sudo -n systemctl restart longstream
'
```
Confirm `LOAD_OK` before/with the restart. A from-source `better-sqlite3` build takes 1-3 min.

## Recovery: site down

```bash
sudo systemctl status longstream          # what state is it in?
sudo journalctl -u longstream -n 40        # crash reason
sudo systemctl restart longstream
```
After a reboot it should already be up (enabled). If a deploy crashed it, read the log:
- **`ERR_REQUIRE_ESM` (marked)** — `marked` is ESM-only; load via dynamic `import()`, never top-level `require()`.
- **`better-sqlite3` bindings not found** — native binary missing; `npm rebuild better-sqlite3`.
  The code is defensive: if the DB can't load, the site still runs and signups fall back to the log.

## Club signups (SQLite)

`/home/ubuntu/.longstream/club-signups.db`. Read:
```bash
ssh -i /c/Projects/server_key.pem ubuntu@longstream.nz \
 'node -e "const o=require(\"os\"),p=require(\"path\"),D=require(\"/var/www/longstream-website/node_modules/better-sqlite3\");const db=new D(p.join(o.homedir(),\".longstream\",\"club-signups.db\"),{readonly:true});console.log(JSON.stringify(db.prepare(\"SELECT email,variant,created_at FROM club_signups ORDER BY id\").all(),null,2))"'
```

## Notes / known gaps

- **reCAPTCHA** uses Google's always-pass TEST keys until real keys are set. Add them to the
  systemd unit as `Environment=RECAPTCHA_SITE_KEY=...` / `RECAPTCHA_SECRET_KEY=...`, then
  `sudo systemctl daemon-reload && sudo systemctl restart longstream`.
- Other sites on this box (nesty→benandpetra.nz, contact-api, orbit, mission-control, etc.)
  are NOT yet under systemd — they still run via nohup and won't survive a reboot.
