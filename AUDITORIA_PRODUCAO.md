# AUDITORIA DE PRODUÇÃO — BLOQUEIOS DE DEPLOY

**Data:** May 11, 2026  
**Tipo:** Segurança, Configuração, Bloqueios de Deploy  
**Escopo:** docker-compose.prod.yml, .env.example, Traefik, CORS, Segurança, QR Code  

---

## 🔴 BLOQUEIOS CRÍTICOS ENCONTRADOS

### ⚠️ BLOQUEIO 1: Evolution API Image Tag = "latest"

**Localização:** `docker-compose.prod.yml`, linha 79

```yaml
image: atendai/evolution-api:latest  # ❌ PROBLEMA
```

**Problema:**
- `latest` não é determinístico em produção
- Atualizações automáticas podem quebrar o sistema
- Impossível fazer rollback a versão anterior se houver problema
- Docker pode puxar versão quebrada sem controle

**Risco:** 🔴 **CRÍTICO**

**Solução:**
```yaml
image: atendai/evolution-api:v2.3.7  # ✅ CORRETO
```

(O docker-compose.local.yml usa v2.3.7 corretamente!)

**Status:** ❌ **BLOQUEADOR** — Deve ser corrigido antes de deploy

---

### ⚠️ BLOQUEIO 2: MinIO Image Tag = "latest"

**Localização:** `docker-compose.prod.yml`, linha 53

```yaml
image: minio/minio:latest  # ❌ PROBLEMA
```

**Problema:** Mesmo que Evolution API — falta de determinismo

**Risco:** 🟠 **ALTO**

**Solução:**
```yaml
image: minio/minio:2024.05.01  # ✅ ou outra versão stable pinned
```

**Status:** ❌ **BLOQUEADOR** — Deve ser corrigido

---

### ⚠️ BLOQUEIO 3: DATABASE_SAVE_DATA_* = true (QR Code Issue)

**Localização:** `docker-compose.prod.yml`, linhas 89-92

```yaml
DATABASE_SAVE_DATA_INSTANCE: "true"
DATABASE_SAVE_DATA_NEW_MESSAGE: "true"
DATABASE_SAVE_MESSAGE_UPDATE: "true"
DATABASE_SAVE_DATA_CONTACTS: "true"    # ❌ PROBLEMA
DATABASE_SAVE_DATA_CHATS: "true"       # ❌ PROBLEMA
DATABASE_SAVE_DATA_LABELS: "true"      # ❌ PROBLEMA
DATABASE_SAVE_DATA_HISTORIC: "true"    # ❌ PROBLEMA
```

**Problema:**
- Comunidade Evolution API reporta que salvar muitos dados causa QR Code não gerar
- Erro conhecido: `connect returning {"count":0}` quando DATABASE_SAVE_DATA_CONTACTS/CHATS/LABELS/HISTORIC = true
- **docker-compose.local.yml** usa "false" para estes campos (linhas 70-73)
- Produção **DEVE** usar "false" também para garantir QR Code funcione

**Risco:** 🔴 **CRÍTICO** — Impede conectar WhatsApp em produção

**Solução:**
```yaml
DATABASE_SAVE_DATA_INSTANCE: "true"      # Keep true
DATABASE_SAVE_DATA_NEW_MESSAGE: "true"   # Keep true
DATABASE_SAVE_MESSAGE_UPDATE: "true"     # Keep true
DATABASE_SAVE_DATA_CONTACTS: "false"     # ✅ CHANGE TO FALSE
DATABASE_SAVE_DATA_CHATS: "false"        # ✅ CHANGE TO FALSE
DATABASE_SAVE_DATA_LABELS: "false"       # ✅ CHANGE TO FALSE
DATABASE_SAVE_DATA_HISTORIC: "false"     # ✅ CHANGE TO FALSE
```

**Status:** ❌ **BLOQUEADOR** — QR Code não funcionará se não corrigir

---

### ⚠️ BLOQUEIO 4: CORS_ORIGINS Incluindo localhost em Produção

**Localização:** `.env.example`, linha 70

```env
CORS_ORIGINS=https://evo-crm.seudominio.com,http://localhost:5173
                                                  ❌ PROBLEMA
```

**Problema:**
- `http://localhost:5173` NÃO deve estar em produção
- Abre a API para requisições de localhost qualquer
- Risco de segurança se servidor tiver acesso shell

**Risco:** 🟠 **ALTO** — Exposição de segurança

**Solução:**
```env
# PRODUÇÃO
CORS_ORIGINS=https://evo-crm.seudominio.com

# LOCAL/STAGING
CORS_ORIGINS=https://evo-crm.seudominio.com,http://localhost:5173
```

**Documento:** Deve instruir empresa a remover localhost em produção

**Status:** ⚠️ **AVISO CRÍTICO** — Documentar claramente no README_DEPLOY

---

### ⚠️ BLOQUEIO 5: MinIO Console Exposta ao Público

**Localização:** `docker-compose.prod.yml`, linhas 72-76

```yaml
labels:
  - "traefik.http.routers.minio-console.rule=Host(`${TRAEFIK_MINIO_DOMAIN}`) && PathPrefix(`/console`)"
  - "traefik.http.routers.minio-console.entrypoints=websecure"
  - "traefik.http.routers.minio-console.tls.certresolver=le"
  - "traefik.http.services.minio-console.loadbalancer.server.port=9001"
  - "traefik.http.routers.minio-console.middlewares=security-headers@file"
```

**Problema:**
- MinIO Console é exposta publicamente em `https://minio.seudominio.com/console`
- Sem autenticação adicional (IP whitelist, htpasswd, etc)
- Qualquer um na internet pode acessar a interface de admin
- Comentário no arquivo menciona "recomendado restringir por IP" mas não implementa

**Risco:** 🔴 **CRÍTICO** — Acesso não autorizado ao storage

**Solução (Opção 1 - Restringir por IP):**
```yaml
labels:
  - "traefik.http.routers.minio-console.middlewares=security-headers@file,ip-whitelist@file"
```

**Solução (Opção 2 - Desabilitar console público):**
```yaml
# Remover labels do console
# MinIO API (port 9000) continua acessível via Traefik
# Console pode ser acessado localmente: docker compose exec minio sh
```

**Solução (Opção 3 - Usar Basic Auth):**
```yaml
labels:
  - "traefik.http.middlewares.minio-auth.basicauth.usersfile=/etc/traefik/auth"
  - "traefik.http.routers.minio-console.middlewares=security-headers@file,minio-auth@docker"
```

**Recomendação:** Documentar que empresa deve restringir console ou desabilitar

**Status:** ❌ **BLOQUEADOR** ou ⚠️ **REQUER AÇÃO**

---

### ⚠️ BLOQUEIO 6: Falta Variável de Domínio Traefik

**Localização:** `.env.example` e `docker-compose.prod.yml`

**Problema:**
- `${TRAEFIK_DOMAIN}` usado em labels (linhas 171, 198)
- `${TRAEFIK_EVOLUTION_DOMAIN}` usado (linha 121)
- `${TRAEFIK_MINIO_DOMAIN}` usado (linhas 66, 72)
- Mas `.env.example` não claramente separa a variável "TRAEFIK_DOMAIN" vs URLs individuais
- Se empresa esquecer de definir, containers não iniciarão

**Risco:** 🟠 **ALTO** — Deploy falha silenciosamente

**Solução:**
```env
# Adicionar claramente ao .env.example:
# ===== TRAEFIK ROUTING =====
TRAEFIK_DOMAIN=evo-crm.seudominio.com              # Frontend + Backend /api
TRAEFIK_EVOLUTION_DOMAIN=evolution-api.seudominio.com
TRAEFIK_MINIO_DOMAIN=minio.seudominio.com
```

**Status:** ⚠️ **AVISO** — Documentar claramente

---

## 🟠 PROBLEMAS ALTOS (Não bloqueadores, mas importante)

### PROBLEMA 1: Sem Health Check para MinIO

**Localização:** `docker-compose.prod.yml`, serviço MinIO (linhas 52-76)

```yaml
# ❌ SEM healthcheck
restart: always
```

**Problema:**
- `restart: always` reinicia se crash, mas não valida health
- Backend pode tentar usar MinIO antes dele estar pronto
- Sem healthcheck explícito, `depends_on` não aguarda MinIO estar saudável

**Solução:**
```yaml
healthcheck:
  test: ["CMD", "mc", "ping", "minio"]
  interval: 10s
  timeout: 5s
  retries: 10
restart: always
```

**Risco:** 🟠 **ALTO** — Race condition em startup

---

### PROBLEMA 2: Frontend Sem Health Check

**Localização:** `docker-compose.prod.yml`, serviço frontend (linhas 177-202)

```yaml
# ❌ SEM healthcheck
restart: always
```

**Problema:**
- Nginx pode estar rodando mas não servindo páginas
- Sem healthcheck, Traefik pode rotear para frontend não pronto

**Solução:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 5s
  retries: 3
restart: always
```

**Risco:** 🟠 **ALTO** — 502 Bad Gateway em startup

---

### PROBLEMA 3: Traefik Sem Health Check

**Localização:** `docker-compose.prod.yml`, serviço traefik (linhas 4-18)

**Problema:**
- Proxy reverso crítico sem validação de saúde
- Sem health check, Backend aguarda apenas `docker.sock` estar disponível

**Solução:**
```yaml
healthcheck:
  test: ["CMD", "traefik", "healthcheck", "--ping"]
  interval: 10s
  timeout: 5s
  retries: 10
restart: always
```

**Risco:** 🟠 **MÉDIO** — Proxy reverso pode estar quebrado

---

### PROBLEMA 4: Backend Depends on MinIO `service_started`

**Localização:** `docker-compose.prod.yml`, linhas 154-155

```yaml
minio:
  condition: service_started  # ⚠️ Não aguarda healthy
```

**Problema:**
- `service_started` só verifica se container iniciou, não se está saudável
- Backend tenta conectar em MinIO antes dele estar pronto
- Deveria ser `service_healthy`

**Solução:**
```yaml
minio:
  condition: service_healthy  # ✅ Aguarda health check
```

**Risco:** 🟠 **ALTO** — Falha em startup

---

### PROBLEMA 5: EVOLUTION_API_URL_INTERNAL Hardcoded

**Localização:** `docker-compose.prod.yml`, linha 139

```yaml
EVOLUTION_API_URL_INTERNAL: ${EVOLUTION_API_URL_INTERNAL}
```

**Problema:**
- Se empresa mudar nome do container ou network, quebra
- Deveria ser sempre `http://evolution-api:8080` (nome do serviço)

**Solução:**
```yaml
# .env.example
EVOLUTION_API_URL_INTERNAL=http://evolution-api:8080  # ✅ Usar nome do container
```

**Risco:** 🟠 **ALTO** — Quebra se empresa não seguir convenção

---

## 🟢 PONTOS POSITIVOS (Verificados ✅)

| Item | Status | Detalhes |
|------|--------|----------|
| **Portas Públicas** | ✅ OK | Apenas 80 e 443 expostos (Traefik) |
| **Postgres não exposto** | ✅ OK | Port 5432 interno apenas |
| **Redis não exposto** | ✅ OK | Port 6379 interno apenas |
| **Networks isoladas** | ✅ OK | `internal: true` bloqueia egress |
| **Evolution tem ambas networks** | ✅ OK | Precisa internet para WhatsApp |
| **Volumes persistentes** | ✅ OK | postgres_data, minio_data, evolution_store/instances |
| **Traefik com SSL** | ✅ OK | Let's Encrypt automático |
| **Security headers** | ✅ OK | HSTS, X-Frame-Options, CSP, etc |
| **Rate limiting** | ✅ OK | 50 avg, 100 burst |
| **Restart always** | ✅ OK | Todos em produção com `always` |
| **Backend health check** | ✅ OK | GET /api/health configurado |
| **Postgres health check** | ✅ OK | pg_isready configurado |
| **Redis health check** | ✅ OK | redis-cli ping configurado |
| **Evolution health check** | ✅ OK | HTTP GET localhost:8080 |

---

## ✅ VERIFICAÇÃO PONTO POR PONTO

### 1. Docker-Compose.prod.yml

| Item | Status | Verificação |
|------|--------|-----------|
| Portas públicas (80, 443) | ✅ OK | Apenas Traefik exposto |
| Services (6 obrigatórios) | ✅ OK | traefik, postgres, redis, minio, evolution, backend, frontend |
| Networks (internal, public) | ✅ OK | Corretamente separadas |
| Volumes (persistência) | ✅ OK | postgres_data, redis_data, minio_data, evolution_* |
| Evolution image tag | ❌ ERRO | `latest` — deve ser `v2.3.7` |
| MinIO image tag | ❌ ERRO | `latest` — deve ser pinned |
| DATABASE_SAVE_DATA_* | ❌ ERRO | Deve ser false (QR Code issue) |
| Health Checks | ⚠️ PARCIAL | Faltam para MinIO, Frontend, Traefik |
| Restart policies | ✅ OK | Todos com `always` |
| Traefik labels | ✅ OK | Rotas, TLS, security headers corretos |
| depends_on conditions | ⚠️ PARCIAL | MinIO usa `service_started` (deveria ser `healthy`) |

**Status docker-compose.prod.yml:** ❌ **REQUER CORREÇÕES CRÍTICAS** (3 bloqueadores)

---

### 2. .env.example

| Item | Status | Verificação |
|------|--------|-----------|
| Sem secrets reais | ✅ OK | Usa "change-me" |
| URLs públicas HTTPS | ✅ OK | https://evo-crm.seudominio.com |
| URLs internas http | ✅ OK | http://evolution-api:8080, http://minio:9000 |
| CORS_ORIGINS | ❌ ERRO | Inclui http://localhost:5173 para produção |
| JWT_SECRET format | ⚠️ AVISO | Deveria indicar para gerar com openssl |
| POSTGRES_PASSWORD | ⚠️ AVISO | Deveria indicar para gerar senha forte |
| MINIO_ROOT_PASSWORD | ⚠️ AVISO | Deveria indicar para gerar senha forte |
| Variáveis de Traefik | ⚠️ PARCIAL | TRAEFIK_DOMAIN não claramente separado |
| Variáveis ausentes | ✅ OK | Tem todas as necessárias |

**Status .env.example:** ⚠️ **REQUER AJUSTES** (2 erros, 3 avisos)

---

### 3. CORS

| Item | Status | Verificação |
|------|--------|-----------|
| FRONTEND_URL | ✅ OK | https://evo-crm.seudominio.com |
| API_URL | ✅ OK | https://evo-crm.seudominio.com/api |
| BACKEND_URL (falta?) | ⚠️ | Não existe, backend não é exposição separada |
| CORS_ORIGINS | ❌ ERRO | Inclui http://localhost:5173 em produção |
| VITE_API_URL | ✅ OK | Build arg correto |

**Status CORS:** ❌ **REQUER AJUSTE** (1 erro crítico)

---

### 4. Segurança

| Item | Status | Verificação |
|------|--------|-----------|
| PostgreSQL não exposto | ✅ OK | Port 5432 apenas em `internal` |
| Redis não exposto | ✅ OK | Port 6379 apenas em `internal` |
| MinIO protegido | ⚠️ PARCIAL | Console exposta publicamente |
| Evolution API com key | ✅ OK | EVOLUTION_API_KEY obrigatório |
| JWT secrets fortes | ⚠️ | Deveria indicar geração com openssl |
| Network isolation | ✅ OK | `internal: true` bloqueia egress |
| Security headers | ✅ OK | HSTS, X-Frame, CSP, etc |
| Rate limiting | ✅ OK | 50/s average, 100 burst |

**Status Segurança:** ⚠️ **REQUER AJUSTES** (MinIO console)

---

### 5. QR Code

**CRÍTICO:** DATABASE_SAVE_DATA_CONTACTS/CHATS/LABELS/HISTORIC devem ser "false"

| Item | Status | Verificação |
|------|--------|-----------|
| Evolution tem internet | ✅ OK | Em ambas networks (internal + public) |
| Documentado no README | ⚠️ | README_DEPLOY menciona, mas não clara a config do compose |
| Database config correto | ❌ ERRO | docker-compose.prod.yml linha 89-92 estão como true |
| Local.yml vs Prod divergência | ❌ ERRO | local.yml tem false, prod.yml tem true |

**Status QR Code:** ❌ **BLOQUEADOR CRÍTICO**

---

### 6. Domínio/HTTPS

| Item | Status | Verificação |
|------|--------|-----------|
| Traefik em uso | ✅ OK | docker-compose.prod.yml linhas 4-18 |
| Portas 80/443 | ✅ OK | Expostas apenas em Traefik |
| DNS | ✅ | Documentado no README (TRAEFIK_DOMAIN) |
| SSL automático | ✅ OK | Let's Encrypt com httpChallenge |
| Certificados persistidos | ✅ OK | Volume letsencrypt:/letsencrypt |
| Redirect HTTP→HTTPS | ✅ OK | traefik.yml linha 10 |

**Status Domínio/HTTPS:** ✅ **OK**

---

### 7. Volumes

| Item | Status | Verificação |
|------|--------|-----------|
| postgres_data | ✅ OK | Persistente, não volume local |
| redis_data | ✅ OK | Persistente, com AOF |
| minio_data | ✅ OK | Persistente |
| evolution_store | ✅ OK | Persistente |
| evolution_instances | ✅ OK | Persistente |
| letsencrypt | ✅ OK | Persistente, para renovação SSL |

**Status Volumes:** ✅ **OK**

---

## 📋 CHECKLIST DA EMPRESA

### Antes de Subir (Setup)

- [ ] Ler `README_DEPLOY.md` completamente
- [ ] Verificar máquina tem Docker 24.0+
- [ ] Verificar máquina tem Docker Compose 2.20+
- [ ] Domínio apontado para IP do servidor
- [ ] Portas 80/443 liberadas no firewall
- [ ] Mínimo 6GB RAM disponível
- [ ] Mínimo 50GB SSD disponível
- [ ] Criar `/data/{postgres,redis,minio,evolution}` com chmod 700
- [ ] Copiar `.env.example` → `.env`
- [ ] Preencher TODAS as variáveis em `.env` (ver checklist abaixo)
- [ ] **REMOVER `http://localhost:5173` de CORS_ORIGINS** (é produção!)
- [ ] Validar variáveis sensíveis geradas (JWT, passwords, API keys)

### .env Checklist Crítico

**Variáveis que DEVEM ser mudadas:**

- [ ] `JWT_SECRET=` — Gerar: `openssl rand -base64 32`
- [ ] `JWT_REFRESH_SECRET=` — Gerar: `openssl rand -base64 32`
- [ ] `POSTGRES_PASSWORD=` — Gerar: `openssl rand -base64 32`
- [ ] `MINIO_ROOT_PASSWORD=` — Gerar: `openssl rand -base64 32`
- [ ] `EVOLUTION_API_KEY=` — Gerar: `openssl rand -hex 16`
- [ ] `EVOLUTION_WEBHOOK_SECRET=` — Gerar: `openssl rand -hex 16`
- [ ] `TRAEFIK_DOMAIN=evo-crm.seudominio.com` — Seu domínio real
- [ ] `TRAEFIK_EMAIL=seu-email@dominio.com` — Email real para SSL
- [ ] `TRAEFIK_EVOLUTION_DOMAIN=evolution-api.seudominio.com` — Seu domínio
- [ ] `TRAEFIK_MINIO_DOMAIN=minio.seudominio.com` — Seu domínio
- [ ] `CORS_ORIGINS=https://evo-crm.seudominio.com` — **REMOVER localhost!**
- [ ] `EVOLUTION_API_URL_PUBLIC=https://evolution-api.seudominio.com` — Seu domínio

**Variáveis que podem ficar padrão:**

- [ ] `POSTGRES_USER=evo` — OK
- [ ] `POSTGRES_DB=evo_crm` — OK
- [ ] `DATABASE_URL=postgresql://evo:change-me@postgres:5432/evo_crm?schema=public` — OK (substituir password acima)
- [ ] `REDIS_HOST=redis` — OK
- [ ] `REDIS_PORT=6379` — OK
- [ ] `MINIO_ROOT_USER=minio` — OK (pode mudar se quiser)
- [ ] `MINIO_ENDPOINT=http://minio:9000` — OK
- [ ] `EVOLUTION_API_URL_INTERNAL=http://evolution-api:8080` — OK

### Depois de Subir (Validação)

- [ ] Aguardar 60 segundos para startup completo
- [ ] `docker compose -f docker-compose.prod.yml ps` — Todos "Up"
- [ ] `curl https://SEU_DOMINIO/api/health` — HTTP 200 + JSON
- [ ] `curl https://SEU_DOMINIO` — Frontend carrega (pode ter redirect)
- [ ] Abrir `https://SEU_DOMINIO` no navegador — Login funciona
- [ ] **NÃO** ver erros de CORS no console do navegador
- [ ] `docker compose logs evolution-api | grep -i "qr\|pairing"` — Sem erros críticos
- [ ] Verificar logs por 30 segundos: `docker compose logs -f`

### Validação do QR Code (CRÍTICO!)

**Passos:**

1. Login como admin
2. Ir para `/admin/instances`
3. Clicar "Nova Instância"
4. Preencher nome (ex: "WhatsApp Teste")
5. Clicar "Gerar QR Code"
6. **QR deve aparecer em ~10-15 segundos** (não mais)
7. Escanear com WhatsApp
8. Confirmar no telefone
9. **Status deve virar "CONNECTED"** em ~30-45 segundos
10. **Se tudo OK:** QR Code está funcionando ✅
11. **Se QR não aparece ou delay >30s:**
    - Verificar: `docker compose logs evolution-api --tail=100`
    - Procurar: "connect returning" ou "{"count":0}"
    - **PROVÁVEL CAUSA:** DATABASE_SAVE_DATA_CONTACTS=true (linha 89)
    - **SOLUÇÃO:** Mudar para false e reiniciar evolution-api

### Teste com 1 Contato (Opcional)

**Apenas se QR Code funciona:**

1. Admin > Contatos > "Novo contato"
   - Nome: "Teste Admin"
   - Telefone: Seu número
   - Opt-in: ✅ Marcado
   - Salvar

2. Admin > Templates > "Novo template"
   - Nome: "Teste"
   - Conteúdo: "Olá {{nome}}, teste do ChipFire"
   - Salvar

3. Admin > Campanhas > "Nova campanha"
   - Template: "Teste"
   - Contatos: Selecionar "Teste Admin"
   - **NÃO ENVIAR YET**, Salvar em rascunho

4. Abrir campanha
   - Clicar "Simular"
   - Ver preview esperado
   - Se OK, clicar "Enviar"
   - Aguardar ~30s
   - Checar WhatsApp

5. **Se mensagem chegou:** Tudo funcionando ✅

---

## 🔧 CORREÇÕES NECESSÁRIAS ANTES DE DEPLOY

### Correção 1: Fix Evolution Image Tag

**Arquivo:** `docker-compose.prod.yml`, linha 79

Antes:
```yaml
image: atendai/evolution-api:latest
```

Depois:
```yaml
image: atendai/evolution-api:v2.3.7
```

---

### Correção 2: Fix MinIO Image Tag

**Arquivo:** `docker-compose.prod.yml`, linha 53

Antes:
```yaml
image: minio/minio:latest
```

Depois:
```yaml
image: minio/minio:2024.05.01
```

---

### Correção 3: Fix DATABASE_SAVE_DATA_* (QR ISSUE)

**Arquivo:** `docker-compose.prod.yml`, linhas 89-92

Antes:
```yaml
DATABASE_SAVE_DATA_CONTACTS: "true"
DATABASE_SAVE_DATA_CHATS: "true"
DATABASE_SAVE_DATA_LABELS: "true"
DATABASE_SAVE_DATA_HISTORIC: "true"
```

Depois:
```yaml
DATABASE_SAVE_DATA_CONTACTS: "false"
DATABASE_SAVE_DATA_CHATS: "false"
DATABASE_SAVE_DATA_LABELS: "false"
DATABASE_SAVE_DATA_HISTORIC: "false"
```

**Justificativa:** Workaround recomendado pela comunidade Evolution API para evitar erro de QR Code não gerar.

---

### Correção 4: Fix CORS_ORIGINS em .env.example

**Arquivo:** `.env.example`, linha 70

Antes:
```env
CORS_ORIGINS=https://evo-crm.seudominio.com,http://localhost:5173
```

Depois:
```env
# PRODUÇÃO - remover localhost!
CORS_ORIGINS=https://evo-crm.seudominio.com

# DEV/LOCAL (apenas no .env local, não em produção)
# CORS_ORIGINS=https://evo-crm.seudominio.com,http://localhost:5173
```

---

### Correção 5: Adicionar Health Checks

**Arquivo:** `docker-compose.prod.yml`

#### 5a. MinIO Health Check (após linha 59)

```yaml
    healthcheck:
      test: ["CMD", "mc", "ping", "minio"]
      interval: 10s
      timeout: 5s
      retries: 10
```

#### 5b. Frontend Health Check (após linha 189)

```yaml
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
```

#### 5c. Backend depends_on MinIO (linha 154-155)

Antes:
```yaml
    minio:
      condition: service_started
```

Depois:
```yaml
    minio:
      condition: service_healthy
```

---

### Correção 6: Proteger MinIO Console

**Arquivo:** `docker-compose.prod.yml`, linhas 72-76

**Opção A (Recomendado: Desabilitar Console Público):**

Remover ou comentar:
```yaml
      # Console opcional (recomendado restringir por IP)
      - "traefik.http.routers.minio-console.rule=Host(`${TRAEFIK_MINIO_DOMAIN}`) && PathPrefix(`/console`)"
      - "traefik.http.routers.minio-console.entrypoints=websecure"
      - "traefik.http.routers.minio-console.tls.certresolver=le"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"
      - "traefik.http.routers.minio-console.middlewares=security-headers@file"
```

Documentar que console pode ser acessado via:
```bash
docker compose exec minio mc alias set local http://localhost:9000 minio password
docker compose exec minio mc mb local/evo-crm
```

**Opção B (Se empresa quer console público):**

Adicionar autenticação:
```yaml
      # Adicionar arquivo de auth ao Traefik
      - "traefik.http.middlewares.minio-auth.basicauth.users=admin:hash_da_senha"
      - "traefik.http.routers.minio-console.middlewares=security-headers@file,minio-auth@docker"
```

---

## 📊 TABELA FINAL DE AUDITORIA

| ITEM | STATUS | RISCO | CORREÇÃO | BLOQUEADOR? |
|------|--------|-------|----------|-----------|
| Evolution image = latest | ❌ | CRÍTICO | Usar v2.3.7 | ✅ SIM |
| MinIO image = latest | ❌ | ALTO | Usar 2024.05.01 | ✅ SIM |
| DATABASE_SAVE_DATA_* = true | ❌ | CRÍTICO | Mudar para false | ✅ SIM |
| CORS inclui localhost | ❌ | ALTO | Remover localhost | ✅ SIM |
| MinIO console exposta | ⚠️ | CRÍTICO | Desabilitar ou auth | ⚠️ REQUER AÇÃO |
| Sem health check MinIO | ⚠️ | ALTO | Adicionar | ⚠️ REQUER AÇÃO |
| Sem health check Frontend | ⚠️ | ALTO | Adicionar | ⚠️ REQUER AÇÃO |
| Backend depends_on MinIO started | ❌ | ALTO | Mudar para healthy | ✅ SIM |
| PostgreSQL não exposto | ✅ | N/A | OK | ❌ NÃO |
| Redis não exposto | ✅ | N/A | OK | ❌ NÃO |
| Evolution tem internet | ✅ | N/A | OK | ❌ NÃO |
| Volumes persistentes | ✅ | N/A | OK | ❌ NÃO |
| SSL automático | ✅ | N/A | OK | ❌ NÃO |
| Security headers | ✅ | N/A | OK | ❌ NÃO |
| Rate limiting | ✅ | N/A | OK | ❌ NÃO |

---

## ⚠️ RESUMO EXECUTIVO

### Bloqueadores Críticos (4)

1. ❌ Evolution API image = `latest` → Corrigir para `v2.3.7`
2. ❌ MinIO image = `latest` → Corrigir para versão pinned
3. ❌ DATABASE_SAVE_DATA_* = `true` → Corrigir para `false` (QR Code quebra)
4. ❌ CORS_ORIGINS inclui `http://localhost:5173` → Remover para produção

### Ações Recomendadas (3)

1. ⚠️ Adicionar health checks (MinIO, Frontend, Traefik)
2. ⚠️ Proteger MinIO console (desabilitar ou auth)
3. ⚠️ Mudar `depends_on minio` de `service_started` para `service_healthy`

### Documentação Necessária

- [ ] README_DEPLOY.md já menciona, mas ADD avisos sobre `CORS_ORIGINS` produção
- [ ] ADD seção "QR Code Troubleshooting" com DATABASE_SAVE_DATA_* como primeira causa
- [ ] ADD aba "Image Tags" explicando por que não usar `latest`

---

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║    AUDITORIA DE PRODUÇÃO — BLOQUEIOS ENCONTRADOS              ║
║                                                                ║
║    🔴 4 Bloqueadores Críticos                                 ║
║    ⚠️ 3 Ações Recomendadas                                    ║
║    ✅ 12 Pontos Positivos                                     ║
║                                                                ║
║    CORRIGIR TODOS OS 4 BLOQUEADORES ANTES DE DEPLOY          ║
║                                                                ║
║    PACOTE SEGURO PARA HOMOLOGAÇÃO:                            ║
║    ❌ NÃO — REQUER CORREÇÕES CRÍTICAS                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Status:** 🔴 **RETORNO PARA CORREÇÕES**

Próximo passo: Aplicar as 6 correções acima ao `docker-compose.prod.yml` e `.env.example`.
