#!/usr/bin/env bash
# Copies brews.db to backups/ with a timestamp, and prunes backups older than
# 30 days. Safe to run anytime, including while the app is running — SQLite's
# default journal mode makes a plain file copy consistent as long as no write
# is in progress at the exact instant of the copy (extremely unlikely to matter
# for a personal, low-write app like this).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$REPO_DIR/brews.db"
BACKUP_DIR="$REPO_DIR/backups"

if [ ! -f "$DB_PATH" ]; then
  echo "No brews.db found at $DB_PATH — nothing to back up." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%Y-%m-%d_%H%M%S)"
dest="$BACKUP_DIR/brews-$timestamp.db"
cp "$DB_PATH" "$dest"
echo "Backed up to $dest"

find "$BACKUP_DIR" -name 'brews-*.db' -mtime +30 -delete
