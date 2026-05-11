$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.local.example") {
    Copy-Item ".env.local.example" ".env" -Force
    Write-Host "Criei .env a partir de .env.local.example. Revise as variáveis se necessário."
  } else {
    throw "Arquivo .env não encontrado. Copie .env.local.example -> .env"
  }
}

Write-Host "Subindo stack local (docker-compose.local.yml)..."
docker compose -f docker-compose.local.yml up -d --build

Write-Host "OK. Acesse:"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3000/api/health"
Write-Host "Evo API:  http://localhost:8080"
Write-Host "MinIO:    http://localhost:9001"

