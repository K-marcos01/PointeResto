#!/usr/bin/env bash
set -euo pipefail

# Sauvegarde complète de la base PostgreSQL PointeResto (local ou Railway via DATABASE_URL)
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" --clean --if-exists --no-owner -F p -f "$BACKUP_DIR/pointeresto_${TIMESTAMP}.sql"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGDATABASE="${PGDATABASE:-pointeresto}"
  PGUSER="${PGUSER:-postgres}"
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists --no-owner -F p -f "$BACKUP_DIR/pointeresto_${TIMESTAMP}.sql"
fi

echo "Sauvegarde créée avec succès : $BACKUP_DIR/pointeresto_${TIMESTAMP}.sql"