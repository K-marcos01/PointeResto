#!/usr/bin/env bash
set -euo pipefail

# Restauration d'une sauvegarde SQL PostgreSQL PointeResto
if [ $# -lt 1 ]; then
  echo "Usage : ./database/restore.sh <chemin_fichier_backup.sql>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Erreur : fichier introuvable ($BACKUP_FILE)"
  exit 1
fi

if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$BACKUP_FILE"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGDATABASE="${PGDATABASE:-pointeresto}"
  PGUSER="${PGUSER:-postgres}"
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$BACKUP_FILE"
fi

echo "Restauration terminée avec succès depuis : $BACKUP_FILE"