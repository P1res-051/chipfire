#Requires -Version 5.1
param(
    [ValidateSet("all", "backend", "frontend")]
    [string]$Service = "all",
    [switch]$Minor,
    [switch]$Major
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# --- Configuracao -------------------------------------------------------
$REGISTRY        = "p1res051"
$VERSION_FILE    = "$PSScriptRoot\VERSION"
$VITE_API_URL    = "https://chipfire-api.automation.app.br/api"
$VITE_APP_URL    = "https://chipfire.automation.app.br"
$BACKEND_CTX     = "$PSScriptRoot\apps\backend"
$FRONTEND_CTX    = "$PSScriptRoot\apps\frontend"

# --- Helpers ------------------------------------------------------------
function Step([string]$msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function OK([string]$msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Fail([string]$msg) {
    Write-Host "    [ERRO] $msg" -ForegroundColor Red
    exit 1
}

function Run-Docker {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$DockerArgs
    )

    # Chamar diretamente evita problemas de quoting/ArgumentList (principalmente no argumento de contexto do build).
    & docker @DockerArgs
    if ($LASTEXITCODE -ne 0) {
        Fail "docker $($DockerArgs[0]) falhou (exit $LASTEXITCODE)"
    }
}

# --- Versao -------------------------------------------------------------
Step "Calculando proxima versao"

if (-not (Test-Path $VERSION_FILE)) { "1.0.0" | Set-Content $VERSION_FILE }

$current = (Get-Content $VERSION_FILE -Raw).Trim()
$parts   = $current -split '\.'
if ($parts.Count -ne 3) { Fail "Formato invalido em VERSION: '$current' (esperado X.Y.Z)" }

[int]$maj = $parts[0]; [int]$min = $parts[1]; [int]$pat = $parts[2]

if     ($Major) { $maj++; $min = 0; $pat = 0 }
elseif ($Minor) { $min++; $pat = 0 }
else            { $pat++ }

$newVersion = "$maj.$min.$pat"
$newTag     = "v$newVersion"

Write-Host "    Versao atual : v$current"
Write-Host "    Nova versao  : $newTag" -ForegroundColor Yellow

# --- Docker OK? ---------------------------------------------------------
Step "Verificando Docker Desktop"
$null = docker info 2>&1
if ($LASTEXITCODE -ne 0) { Fail "Docker nao esta rodando. Abra o Docker Desktop." }
OK "Docker OK"

# --- Backend ------------------------------------------------------------
if ($Service -eq "all" -or $Service -eq "backend") {
    Step "Build backend  ->  ${REGISTRY}/chipfire-backend:${newTag}"

    $env:DOCKER_BUILDKIT = "0"

    Run-Docker "build" "--target" "prod" `
        "-t" "${REGISTRY}/chipfire-backend:${newTag}" `
        "-t" "${REGISTRY}/chipfire-backend:latest" `
        "-f" "$BACKEND_CTX\Dockerfile" `
        $BACKEND_CTX

    OK "Backend buildado"

    Step "Push backend"
    Run-Docker "push" "${REGISTRY}/chipfire-backend:${newTag}"
    Run-Docker "push" "${REGISTRY}/chipfire-backend:latest"
    OK "Push: ${REGISTRY}/chipfire-backend:${newTag} + :latest"
}

# --- Frontend -----------------------------------------------------------
if ($Service -eq "all" -or $Service -eq "frontend") {
    Step "Build frontend  ->  ${REGISTRY}/chipfire-frontend:${newTag}"
    Write-Host "    VITE_API_URL = $VITE_API_URL"
    Write-Host "    VITE_APP_URL = $VITE_APP_URL"

    $env:DOCKER_BUILDKIT = "0"

    Run-Docker "build" "--target" "prod" `
        "--build-arg" "VITE_API_URL=$VITE_API_URL" `
        "--build-arg" "VITE_APP_URL=$VITE_APP_URL" `
        "-t" "${REGISTRY}/chipfire-frontend:${newTag}" `
        "-t" "${REGISTRY}/chipfire-frontend:latest" `
        "-f" "$FRONTEND_CTX\Dockerfile" `
        $FRONTEND_CTX

    OK "Frontend buildado"

    Step "Push frontend"
    Run-Docker "push" "${REGISTRY}/chipfire-frontend:${newTag}"
    Run-Docker "push" "${REGISTRY}/chipfire-frontend:latest"
    OK "Push: ${REGISTRY}/chipfire-frontend:${newTag} + :latest"
}

# --- Salvar versao -------------------------------------------------------
Step "Atualizando VERSION"
$newVersion | Set-Content $VERSION_FILE
OK "VERSION -> $newVersion"

# --- Resumo -------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "  Build e push concluidos!" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green

if ($Service -eq "all" -or $Service -eq "backend") {
    Write-Host "  Backend  : ${REGISTRY}/chipfire-backend:${newTag}"
}
if ($Service -eq "all" -or $Service -eq "frontend") {
    Write-Host "  Frontend : ${REGISTRY}/chipfire-frontend:${newTag}"
}
Write-Host ""
