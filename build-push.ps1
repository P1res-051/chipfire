#Requires -Version 5.1
<#
.SYNOPSIS
    Build e push das imagens Docker do ChipFire para o Docker Hub.
.DESCRIPTION
    Lê a versão atual do arquivo VERSION, incrementa o patch (ex: 1.0.4 -> 1.0.5),
    builda backend e/ou frontend, faz push com a nova tag e atualiza :latest.
.PARAMETER Service
    Qual serviço buildar: "backend", "frontend" ou "all" (padrão: all)
.PARAMETER Minor
    Incrementa o minor em vez do patch (ex: 1.0.4 -> 1.1.0)
.PARAMETER Major
    Incrementa o major em vez do patch (ex: 1.0.4 -> 2.0.0)
.EXAMPLE
    .\build-push.ps1
    .\build-push.ps1 -Service backend
    .\build-push.ps1 -Service frontend
    .\build-push.ps1 -Minor
#>
param(
    [ValidateSet("all", "backend", "frontend")]
    [string]$Service = "all",

    [switch]$Minor,
    [switch]$Major
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Configuração ────────────────────────────────────────────────────────────
$REGISTRY   = "alecmoura10"
$VERSION_FILE = "$PSScriptRoot\VERSION"

# URLs baked no build do frontend — ajustar se o domínio mudar
$VITE_API_URL = "https://chipfire-api.automation.app.br/api"
$VITE_APP_URL = "https://chipfire.automation.app.br"

# ─── Funções utilitárias ─────────────────────────────────────────────────────
function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Write-Fail([string]$msg) {
    Write-Host "    [ERRO] $msg" -ForegroundColor Red
    exit 1
}

function Invoke-Docker([string[]]$args) {
    & docker @args
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker $($args[0]) falhou (exit $LASTEXITCODE)" }
}

# ─── Versão ──────────────────────────────────────────────────────────────────
Write-Step "Calculando próxima versão"

if (-not (Test-Path $VERSION_FILE)) {
    "1.0.0" | Set-Content $VERSION_FILE
}

$currentVersion = (Get-Content $VERSION_FILE).Trim()
$parts = $currentVersion -split '\.'
if ($parts.Count -ne 3) { Write-Fail "Formato inválido em VERSION: '$currentVersion' (esperado: X.Y.Z)" }

[int]$maj = $parts[0]
[int]$min = $parts[1]
[int]$pat = $parts[2]

if ($Major) { $maj++; $min = 0; $pat = 0 }
elseif ($Minor) { $min++; $pat = 0 }
else { $pat++ }

$newVersion  = "$maj.$min.$pat"
$newTag      = "v$newVersion"

Write-Host "    Versão atual : v$currentVersion"
Write-Host "    Nova versão  : $newTag" -ForegroundColor Yellow

# ─── Verificar Docker rodando ─────────────────────────────────────────────────
Write-Step "Verificando Docker Desktop"
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Docker não está rodando. Abra o Docker Desktop." }
Write-OK "Docker OK"

# ─── Build backend ───────────────────────────────────────────────────────────
if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Step "Build backend  →  $REGISTRY/chipfire-backend:$newTag"

    $backendCtx = "$PSScriptRoot\apps\backend"
    $backendDockerfile = "$backendCtx\Dockerfile"

    $env:DOCKER_BUILDKIT = "0"
    Invoke-Docker @(
        "build",
        "--target", "prod",
        "-t", "$REGISTRY/chipfire-backend:$newTag",
        "-t", "$REGISTRY/chipfire-backend:latest",
        "-f", $backendDockerfile,
        $backendCtx
    )

    Write-OK "Backend buildado: $REGISTRY/chipfire-backend:$newTag"

    Write-Step "Push backend"
    Invoke-Docker @("push", "$REGISTRY/chipfire-backend:$newTag")
    Invoke-Docker @("push", "$REGISTRY/chipfire-backend:latest")
    Write-OK "Push concluído: $REGISTRY/chipfire-backend:$newTag + :latest"
}

# ─── Build frontend ──────────────────────────────────────────────────────────
if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Step "Build frontend  →  $REGISTRY/chipfire-frontend:$newTag"
    Write-Host "    VITE_API_URL = $VITE_API_URL"
    Write-Host "    VITE_APP_URL = $VITE_APP_URL"

    $frontendCtx = "$PSScriptRoot\apps\frontend"
    $frontendDockerfile = "$frontendCtx\Dockerfile"

    $env:DOCKER_BUILDKIT = "0"
    Invoke-Docker @(
        "build",
        "--target", "prod",
        "--build-arg", "VITE_API_URL=$VITE_API_URL",
        "--build-arg", "VITE_APP_URL=$VITE_APP_URL",
        "-t", "$REGISTRY/chipfire-frontend:$newTag",
        "-t", "$REGISTRY/chipfire-frontend:latest",
        "-f", $frontendDockerfile,
        $frontendCtx
    )

    Write-OK "Frontend buildado: $REGISTRY/chipfire-frontend:$newTag"

    Write-Step "Push frontend"
    Invoke-Docker @("push", "$REGISTRY/chipfire-frontend:$newTag")
    Invoke-Docker @("push", "$REGISTRY/chipfire-frontend:latest")
    Write-OK "Push concluído: $REGISTRY/chipfire-frontend:$newTag + :latest"
}

# ─── Atualizar VERSION ───────────────────────────────────────────────────────
Write-Step "Atualizando arquivo VERSION"
$newVersion | Set-Content $VERSION_FILE
Write-OK "VERSION atualizado para $newVersion"

# ─── Resumo ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Build e push concluídos!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Host "  Backend  : $REGISTRY/chipfire-backend:$newTag"
}
if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Host "  Frontend : $REGISTRY/chipfire-frontend:$newTag"
}
Write-Host "  Próxima versão base: $newVersion"
Write-Host ""
Write-Host "  Para atualizar o cluster k8s (SP):" -ForegroundColor Yellow
Write-Host "  kubectl set image deployment/chipfire-backend backend=$REGISTRY/chipfire-backend:$newTag -n pires"
Write-Host "  kubectl set image deployment/chipfire-frontend frontend=$REGISTRY/chipfire-frontend:$newTag -n pires"
Write-Host ""
