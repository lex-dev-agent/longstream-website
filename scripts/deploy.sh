#!/usr/bin/env bash
# Fast one-shot deploy for longstream.nz.
#   scripts/deploy.sh ["commit message"]
#
# Commits any working-tree changes, pushes, pulls on the server, and restarts
# the systemd service ONLY when server code/deps changed. Template/CSS/image
# changes go live on the pull with no restart (zero downtime).
#
# Override the SSH key with LONGSTREAM_KEY=/path/to/key if needed.
set -euo pipefail

KEY="${LONGSTREAM_KEY:-/c/Projects/server_key.pem}"
HOST="ubuntu@longstream.nz"
MSG="${1:-quick update}"

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "$MSG"
  echo "committed: $MSG"
else
  echo "no local changes to commit"
fi

git push -q origin main
echo "pushed"

ssh -o ConnectTimeout=15 -i "$KEY" "$HOST" '
  set -e
  APP=/var/www/longstream-website
  before=$(git -C "$APP" rev-parse HEAD)
  sudo -n env HOME=/home/ubuntu git -C "$APP" pull --ff-only -q origin main
  after=$(git -C "$APP" rev-parse HEAD)
  if [ "$before" = "$after" ]; then
    echo "server already current ($after)"
  elif git -C "$APP" diff --name-only "$before" "$after" | grep -qE "(^|/)src/.*\.js$|package.*\.json$"; then
    sudo -n systemctl restart longstream
    echo "restarted service (code change)"
  else
    echo "template/asset change - no restart needed"
  fi
  echo "status: $(systemctl is-active longstream) | HEAD: $(git -C "$APP" rev-parse --short HEAD)"
'
echo "deployed"
