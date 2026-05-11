#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./infra/docker/backups}"
mkdir -p "$BACKUP_DIR"

TS="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/evo_crm_${TS}.sql.gz"

echo "Gerando backup do PostgreSQL em: $FILE"

# Usa o serviço postgres do compose atual (dev/prod).
docker compose exec -T postgres sh -c "pg_dump -U \"$POSTGRES_USER\" \"$POSTGRES_DB\"" | gzip > "$FILE"

echo "Backup concluído."

