#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: ./infra/scripts/restore.sh caminho/para/backup.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup não encontrado: $BACKUP_FILE"
  exit 1
fi

echo "Restaurando backup: $BACKUP_FILE"

gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres sh -c "psql -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\""

echo "Restore concluído."

