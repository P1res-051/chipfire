#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env" ]]; then
  echo "Arquivo .env não encontrado. Copie .env.example -> .env e edite os valores."
  exit 1
fi

echo "Subindo containers (produção com Traefik)..."
docker compose -f docker-compose.prod.yml up -d --build

echo "OK. Verifique o status com: docker compose -f docker-compose.prod.yml ps"

