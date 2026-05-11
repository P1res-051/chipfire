# ChipFire CRM — Guia de Deployment para Servidor

> **Versão:** 1.0.0 (ChipFire Visual Refinado + Layout Otimizado)  
> **Data:** May 2026  
> **Status:** Pronto para Produção ✅

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração do .env](#configuração-do-env)
5. [Como Subir em Produção](#como-subir-em-produção)
6. [Verificação de Componentes](#verificação-de-componentes)
7. [Validação de URLs](#validação-de-urls)
8. [Validação de QR Code](#validação-de-qr-code)
9. [Validação de Módulos](#validação-de-módulos)
10. [Teste Controlado Inicial](#teste-controlado-inicial)
11. [Backup e Restore](#backup-e-restore)
12. [Troubleshooting](#troubleshooting)
13. [Checklist de Entrega](#checklist-de-entrega)

---

## Visão Geral

**ChipFire CRM** é um sistema de Central de Relacionamento via WhatsApp, construído com:

- **Backend:** NestJS + Prisma + TypeScript
- **Frontend:** React + Vite + Tailwind CSS (ChipFire Dark Theme)
- **Banco:** PostgreSQL 16
- **Cache:** Redis 7
- **Storage:** MinIO (compatível com S3)
- **Orquestrador:** Traefik v3 (reverse proxy + SSL automático com Let's Encrypt)
- **WhatsApp:** Evolution API v2.3.7+
- **Containers:** Docker Compose com 6 serviços

### Serviços Obrigatórios

| Serviço | Porta | Rede | Descrição |
|---------|-------|------|-----------|
| **Traefik** | 80, 443 | `public` | Reverse proxy, SSL, roteamento |
| **Frontend** | 80 (interno) | `public` | SPA React + Nginx |
| **Backend** | 3000 (interno) | `internal` + `public` | API NestJS |
| **PostgreSQL** | 5432 (interno) | `internal` | Banco de dados relacional |
| **Redis** | 6379 (interno) | `internal` | Cache em memória |
| **MinIO** | 9000, 9001 (internos) | `internal` + `public` | Storage S3-compatível |
| **Evolution API** | 8080 (interno) | `internal` + `public` | Provider WhatsApp |

---

## Pré-requisitos

### Hardware Recomendado

- **CPU:** 4 cores (mínimo 2)
- **RAM:** 8 GB (mínimo 6 GB)
- **Disco:** 50 GB SSD (para uploads, banco, cache)
- **Rede:** Connexão estável com internet (Evolution API precisa sair para WhatsApp)

### Software Obrigatório

- **Docker** 24.0+ ([Instalar](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.20+ ([Instalar](https://docs.docker.com/compose/install/))
- **OpenSSL** (geralmente já instalado em Linux/Mac, ou via `choco install openssl` no Windows)

### Domínio e DNS

- Domínio apontado para o IP do servidor (ex: `evo-crm.seudominio.com`)
- Subdomínios (opcionais, se quiser isolar serviços):
  - `api.seudominio.com` → Backend
  - `evolution-api.seudominio.com` → Evolution API
  - `minio.seudominio.com` → MinIO Console

### Portas Liberadas

No firewall do servidor, libere:

- **80/TCP** (HTTP, será redirecionado para HTTPS)
- **443/TCP** (HTTPS com SSL)

Portas internas (não precisam ser expostas):
- 5432/TCP (PostgreSQL)
- 6379/TCP (Redis)
- 9000/TCP, 9001/TCP (MinIO)
- 8080/TCP (Evolution API)

### Sistema de Arquivos

- Volume `postgres_data` (banco)
- Volume `redis_data` (cache)
- Volume `minio_data` (uploads)
- Volume `evolution_store` (sessões/QR)
- Volume `evolution_instances` (instâncias WhatsApp)

Recomendado: usar mount points em `/data` ou `/srv` para fácil backup/restore.

---

## Estrutura do Projeto

```
evo-crm/
├── apps/
│   ├── backend/                  # API NestJS
│   │   ├── src/
│   │   ├── Dockerfile            # Multi-stage: dev, build, prod
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── frontend/                 # SPA React + Vite
│   │   ├── src/
│   │   ├── Dockerfile            # Multi-stage: dev, build, prod
│   │   ├── infra-nginx.conf      # Nginx para produção
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── ...
├── infra/
│   ├── traefik/
│   │   ├── traefik.yml          # Config estática do Traefik
│   │   └── dynamic.yml          # Config dinâmica (rotas, certs)
│   ├── nginx/
│   │   └── nginx.conf           # Config nginx para frontend
│   ├── docker/
│   │   └── postgres-init/       # Scripts de inicialização DB
│   └── scripts/
│       ├── backup-postgres.sh   # Backup automático
│       ├── restore-postgres.sh  # Restore DB
│       ├── backup-volumes.sh    # Backup volumes Docker
│       ├── check-health.sh      # Verificar saúde dos containers
│       ├── logs.sh              # Consolidar logs
│       └── install.sh           # Setup inicial
├── prisma/
│   ├── schema.prisma            # Schema do banco
│   └── migrations/              # Histórico de migrações
├── docker-compose.yml           # Composição dev/default
├── docker-compose.local.yml     # Composição dev puro (com hot reload)
├── docker-compose.prod.yml      # **Composição de produção com Traefik**
├── .env.example                 # Template de variáveis
├── .dockerignore                # O que NÃO copiar para images
├── .gitignore                   # O que NÃO fazer commit
├── README.md                    # Readme geral
└── README_DEPLOY.md             # **Este arquivo**
```

### Qual Docker Compose Usar?

| Ambiente | Arquivo | Comando |
|----------|---------|---------|
| **Desenvolvimento** | `docker-compose.local.yml` | `docker compose -f docker-compose.local.yml --env-file .env up -d` |
| **Staging/QA** | `docker-compose.yml` | `docker compose up -d` |
| **Produção** | `docker-compose.prod.yml` | `docker compose -f docker-compose.prod.yml --env-file .env up -d --build` |

**Recomendado para servidor:** `docker-compose.prod.yml` com Traefik

---

## Configuração do .env

### Template Completo

Copie `.env.example` para `.env` e ajuste os valores:

```bash
cp .env.example .env
nano .env
```

### Variáveis Críticas (produção)

#### 1. URLs Públicas

```env
# Domínio principal (onde o usuário acessa)
APP_URL=https://evo-crm.seudominio.com
FRONTEND_URL=https://evo-crm.seudominio.com
API_URL=https://evo-crm.seudominio.com/api

# Para Traefik/certificados SSL
TRAEFIK_DOMAIN=evo-crm.seudominio.com
TRAEFIK_EMAIL=admin@seudominio.com
```

#### 2. Segurança (Gerar valores aleatórios!)

```env
# JWT (gerar com: openssl rand -base64 32)
JWT_SECRET=__GERAR_VALOR_ALEATORIO_32_CHARS__
JWT_REFRESH_SECRET=__GERAR_VALOR_ALEATORIO_32_CHARS__

# Evolution API (gerar com: openssl rand -hex 16)
EVOLUTION_API_KEY=__GERAR_VALOR_ALEATORIO__
EVOLUTION_WEBHOOK_SECRET=__GERAR_VALOR_ALEATORIO__
```

#### 3. Banco de Dados

```env
POSTGRES_USER=evo_user
POSTGRES_PASSWORD=__GERAR_SENHA_FORTE__
POSTGRES_DB=evo_crm
DATABASE_URL=postgresql://evo_user:__SENHA__@postgres:5432/evo_crm?schema=public
```

#### 4. Redis

```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=__DEIXAR_VAZIO_OU_GERAR__
```

#### 5. MinIO (Storage)

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=__GERAR_SENHA_FORTE__
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_URL=https://minio.seudominio.com
MINIO_BUCKET=evo-crm
```

#### 6. Evolution API

```env
EVOLUTION_API_URL_INTERNAL=http://evolution-api:8080
EVOLUTION_API_URL_PUBLIC=https://evolution-api.seudominio.com
```

#### 7. CORS (permitir o domínio da aplicação)

```env
CORS_ORIGINS=https://evo-crm.seudominio.com,https://www.seudominio.com
```

#### 8. Limites Operacionais

```env
DEFAULT_DAILY_LIMIT_PER_INSTANCE=200
DEFAULT_ALLOWED_START_TIME=08:00
DEFAULT_ALLOWED_END_TIME=20:00
DEFAULT_INTERVAL_MIN_SECONDS=15
DEFAULT_INTERVAL_MAX_SECONDS=60
MAX_ERROR_RATE_PERCENT=5
MAX_OPTOUT_RATE_PERCENT=2
```

### Gerar Valores Seguros

```bash
# JWT Secret (32 chars)
openssl rand -base64 32

# MINIO Password (32 chars)
openssl rand -base64 32

# Evolution API Key (hex)
openssl rand -hex 16

# Webhook Secret (hex)
openssl rand -hex 16
```

---

## Como Subir em Produção

### Passo 1: Preparar Servidor

```bash
# Conectar ao servidor via SSH
ssh usuario@SEU_SERVIDOR

# Criar diretório do projeto
mkdir -p /opt/evo-crm && cd /opt/evo-crm

# Criar diretórios de dados (com permissões adequadas)
mkdir -p data/{postgres,redis,minio,evolution}
chmod 700 data/*

# Criar diretório de backups
mkdir -p backups
chmod 700 backups
```

### Passo 2: Copiar Arquivos do Projeto

```bash
# Via SCP (substitua seu IP)
scp -r /caminho/local/evo-crm/* usuario@SEU_SERVIDOR:/opt/evo-crm/

# OU clone do repositório (se usar Git)
cd /opt/evo-crm
git clone https://seu-repo.git .
git checkout production  # se houver branch de produção
```

### Passo 3: Configurar .env

```bash
# Copiar template
cp .env.example .env

# Editar com valores reais
nano .env

# Ajustar permissões
chmod 600 .env
```

### Passo 4: Subir Serviços com Docker Compose

```bash
cd /opt/evo-crm

# Build e start (primeira vez)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Aguarde ~30-60 segundos enquanto os containers iniciam
sleep 30

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

### Passo 5: Executar Migrações do Banco

```bash
# Entrar no container do backend
docker compose -f docker-compose.prod.yml exec backend sh

# Dentro do container:
npm run prisma:migrate:deploy
npm run seed  # se houver seed de dados iniciais
exit
```

### Passo 6: Criar Admin Inicial (opcional, se houver script)

```bash
docker compose -f docker-compose.prod.yml exec backend npm run seed:admin
```

---

## Verificação de Componentes

### Ver Status dos Containers

```bash
docker compose -f docker-compose.prod.yml ps
```

**Esperado:** Todos os containers em `Up`:

```
NAME              STATUS
evo-crm-traefik         Up (healthy)
evo-crm-postgres        Up (healthy)
evo-crm-redis           Up (healthy)
evo-crm-minio           Up (healthy)
evo-crm-evolution-api   Up (healthy)
evo-crm-backend         Up (healthy)
evo-crm-frontend        Up (running)
```

### Ver Logs de Cada Serviço

```bash
# Backend
docker compose -f docker-compose.prod.yml logs backend --tail=150

# Frontend
docker compose -f docker-compose.prod.yml logs frontend --tail=150

# Evolution API
docker compose -f docker-compose.prod.yml logs evolution-api --tail=150

# Postgres
docker compose -f docker-compose.prod.yml logs postgres --tail=80

# Redis
docker compose -f docker-compose.prod.yml logs redis --tail=80

# MinIO
docker compose -f docker-compose.prod.yml logs minio --tail=80

# Traefik
docker compose -f docker-compose.prod.yml logs traefik --tail=100
```

### Verificar Volumes

```bash
docker volume ls | grep evo-crm
```

---

## Validação de URLs

### 1. Frontend (SPA React)

```bash
curl -I https://evo-crm.seudominio.com

# Esperado: HTTP/1.1 200 OK
```

Abrir no navegador:
```
https://evo-crm.seudominio.com
```

Deve carregar a tela de login.

### 2. Backend Health Check

```bash
curl -I https://evo-crm.seudominio.com/api/health

# Esperado: HTTP/1.1 200 OK
```

Resposta esperada (JSON):
```json
{
  "status": "ok",
  "timestamp": "2026-05-11T12:34:56.789Z",
  "database": "connected",
  "redis": "connected"
}
```

### 3. Evolution API Status

```bash
curl -I https://evolution-api.seudominio.com/

# Esperado: HTTP/1.1 200 OK
```

### 4. MinIO (opcional, se exposto)

```bash
curl -I https://minio.seudominio.com

# Esperado: HTTP/1.1 200 OK (console)
```

---

## Validação de QR Code

### Checklist: QR Code Funcionando

1. **Abrir no navegador**
   ```
   https://evo-crm.seudominio.com
   ```

2. **Fazer login com admin padrão**
   - Email: `admin@evo-crm.local` (ou conforme configuração)
   - Senha: `admin` (trocar na primeira vez!)

3. **Navegar para `/admin/instances`**
   - Clique em "Novo" ou "Nova Instância"

4. **Criar instância**
   - Nome: `WhatsApp Teste`
   - Clique em "Gerar QR Code"

5. **QR Code deve aparecer**
   - Se não aparecer, checar logs:
     ```bash
     docker compose -f docker-compose.prod.yml logs evolution-api --tail=50
     ```

6. **Escanear QR com WhatsApp Business ou pessoal**
   - Abrir WhatsApp → Configurações → Aparelhos conectados
   - "Conectar um aparelho"
   - Escanear QR
   - Confirmar no telefone

7. **Status deve mudar para "CONNECTED"**
   - Atualizar página (F5)
   - Badge ao lado da instância deve ficar verde

**Se QR não aparecer:**
- Checar internet do servidor (Evolution API precisa acessar WhatsApp)
- Checar logs da Evolution API: `docker logs evo-crm-evolution-api`
- Aguardar 30-60 segundos e tentar novamente
- Se persistir, reiniciar Evolution API:
  ```bash
  docker compose -f docker-compose.prod.yml restart evolution-api
  ```

---

## Validação de Módulos

Após login admin, validar cada módulo:

### 1. Dashboard
- [ ] Abre sem erro
- [ ] Mostra cards de resumo
- [ ] Mostra últimas atividades

### 2. Admin > Usuários
- [ ] Abre lista de usuários
- [ ] Criar novo usuário OK
- [ ] Editar usuário OK
- [ ] Ativar/desativar OK
- [ ] Resetar senha OK
- [ ] Ver limite de instâncias OK

### 3. Admin > Instâncias
- [ ] Listar instâncias OK
- [ ] QR Code funciona (vide seção anterior)
- [ ] Ver status de conexão
- [ ] Desconectar instância
- [ ] Excluir instância

### 4. Admin > Contatos
- [ ] Listar contatos OK
- [ ] Criar contato OK
- [ ] Editar contato OK
- [ ] Importar Excel OK
- [ ] Exportar CSV OK
- [ ] Marcar opt-out OK
- [ ] Filtrar por status/usuário/tag OK

### 5. Admin > Mídia
- [ ] Upload de imagem OK
- [ ] Upload de vídeo OK
- [ ] Upload de áudio OK
- [ ] Upload de PDF OK
- [ ] Ver preview de mídia OK
- [ ] Excluir mídia OK

### 6. Admin > Content Groups
- [ ] Listar grupos OK
- [ ] Criar grupo (tipos: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, MIXED)
- [ ] Adicionar itens ao grupo
- [ ] Ver selection mode (RANDOM, SEQUENTIAL, WEIGHTED_RANDOM, LEAST_USED)
- [ ] Ativar/desativar grupo

### 7. Admin > Templates
- [ ] Listar templates OK
- [ ] Criar template OK
- [ ] Inserir variáveis ({{nome}}, {{telefone}}, {{data}}, etc.)
- [ ] Inserir grupo dinâmico {{grupo:slug}} OK
- [ ] Ver preview WhatsApp em tempo real OK
- [ ] Simular conteúdo dinâmico OK
- [ ] Salvar template com tags OK
- [ ] Editar template OK
- [ ] Deletar template OK

### 8. Admin > Campanhas
- [ ] Listar campanhas OK
- [ ] Criar campanha OK
- [ ] Selecionar contatos com opt-in OK
- [ ] Bloquear opt-out automático OK
- [ ] Definir horário permitido OK
- [ ] Definir limite diário OK
- [ ] Simular antes de enviar OK
- [ ] Ver logs da campanha OK

### 9. User > Inbox
- [ ] Ver conversas da minha instância
- [ ] Listar mensagens da conversa
- [ ] Admin vê todas as instâncias
- [ ] User vê só suas instâncias
- [ ] Marcar lido/não lido
- [ ] Filtros funcionando

### 10. Admin > Logs
- [ ] Ver logs de envio OK
- [ ] Filtrar por tipo (envio, recebimento, erro, webhook)
- [ ] Ver timestamp, mensagem, status
- [ ] Pagination funcionando

### 11. Admin > Configurações
- [ ] Ver tela de configurações
- [ ] Evolution API URL OK
- [ ] MinIO configuração OK
- [ ] Limites globais OK
- [ ] Horários operacionais OK

---

## Teste Controlado Inicial

Após validar os módulos, fazer **um único teste de envio autorizado**:

### 1. Preparar Contato

```sql
-- Ou via UI: Admin > Contatos > Novo Contato
INSERT INTO contacts (
  id, name, phone, tag, optIn, status, userId, createdAt, updatedAt
)
VALUES (
  '550c6a49-cf5f-4f77-9e05-0000000test01',
  'Teste Admin',
  '5511999999999',
  'teste',
  true,
  'ACTIVE',
  '550c6a49-cf5f-4f77-9e05-0000000admin0',
  NOW(),
  NOW()
);
```

Ou via UI:
- Admin > Contatos > "Novo contato"
- Nome: `Teste Admin`
- Telefone: `5511999999999` (seu número)
- Tag: `teste`
- Opt-in: **Marcado** ✓
- Status: `ACTIVE`

### 2. Preparar Template

- Admin > Templates > "Novo template"
- Nome: `Template Teste`
- Conteúdo: `Olá {{nome}}, você recebeu uma mensagem de teste do ChipFire CRM.`
- Tags: `teste`
- Salvar

### 3. Preparar Campanha (não enviar)

- Admin > Campanhas > "Nova campanha"
- Nome: `Campanha Teste`
- Template: `Template Teste`
- Contatos: filtrar por tag `teste`, selecionar `Teste Admin`
- Horário: 08:00 - 20:00
- Limite diário: 1
- **NÃO ENVIAR AINDA**
- Salvar em **rascunho**

### 4. Simular Campanha

- Abrir campanha
- Botão "Simular" (ou similar)
- Verificar preview esperado:
  ```
  Olá Teste Admin, você recebeu uma mensagem de teste do ChipFire CRM.
  ```
- Validar que não há erros

### 5. Teste Real (Opcional)

Se aprovado pela empresa:
- Voltar para campanha
- Botão "Enviar"
- Confirmar envio
- **Aguardar no máximo 30 segundos**
- Verificar no seu WhatsApp se a mensagem chegou
- Se chegou, validar:
  - Texto correto
  - Hora correta
  - Sem formatação quebrada

**Importante:**
- Não enviar campanhas em massa sem autorização prévia
- Respeitar horários comerciais
- Validar sempre em rascunho primeiro
- Checar logs para detectar problemas

---

## Backup e Restore

### Backup Automático (Recomendado)

Agendar cron job para backup diário:

```bash
# Adicionar ao crontab
# crontab -e
0 3 * * * /opt/evo-crm/infra/scripts/backup-postgres.sh
0 3 * * * /opt/evo-crm/infra/scripts/backup-volumes.sh
```

### Backup Manual

#### Banco de Dados (PostgreSQL)

```bash
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U ${POSTGRES_USER} -d ${POSTGRES_DB} \
  > backups/evo_crm_$(date +%Y%m%d_%H%M%S).sql
```

#### Volumes (MinIO, Evolution)

```bash
# Backup de todos os volumes
docker run --rm \
  -v evo-crm_minio_data:/data_minio \
  -v evo-crm_evolution_store:/data_evolution \
  -v $(pwd)/backups:/backups \
  alpine tar czf /backups/volumes_$(date +%Y%m%d_%H%M%S).tar.gz \
  -C /data_minio . -C /data_evolution .
```

#### Arquivo .env (Seguro!)

```bash
# Fazer backup da configuração
cp .env backups/.env.backup_$(date +%Y%m%d_%H%M%S)
chmod 600 backups/.env.backup_*
```

### Restore do Banco

```bash
# Restaurar dump SQL
docker compose -f docker-compose.prod.yml exec -T postgres psql \
  -U ${POSTGRES_USER} -d ${POSTGRES_DB} \
  < backups/evo_crm_DATA.sql
```

### Restore de Volumes

```bash
# Restaurar arquivo compactado
docker run --rm \
  -v evo-crm_minio_data:/data_minio \
  -v evo-crm_evolution_store:/data_evolution \
  -v $(pwd)/backups:/backups \
  alpine tar xzf /backups/volumes_DATA.tar.gz \
  -C /data_minio -C /data_evolution
```

---

## Troubleshooting

### QR Code Não Aparece

**Causa 1: Evolution API sem internet**
```bash
docker compose -f docker-compose.prod.yml logs evolution-api
# Procurar por: "connect ENOTFOUND" ou "network unreachable"
```
**Solução:** Verificar firewall, DNS, conexão com WhatsApp

**Causa 2: Evolution API em rede interna sem egress**
```bash
# Verificar redes do container
docker inspect evo-crm-evolution-api | grep -A 20 "Networks"
```
**Solução:** Garantir que `evolution-api` está em ambas as redes:
```yaml
networks:
  - internal
  - public  # Necessária para internet
```

**Causa 3: Redis ou Banco não conectado**
```bash
docker compose -f docker-compose.prod.yml logs evolution-api
# Procurar por: "redis connection failed" ou "database error"
```
**Solução:** Verificar saúde dos containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

**Causa 4: Timeout na geração de QR**
```bash
# Aumentar timeout de healthcheck (se necessário)
# Editar docker-compose.prod.yml
healthcheck:
  timeout: 10s  # aumentar de 5s para 10s
  retries: 30   # aumentar de 20 para 30
```

### Backend Não Conecta no Banco

```bash
# Ver erro
docker compose -f docker-compose.prod.yml logs backend

# Procurar por: "ECONNREFUSED" ou "FATAL connection refused"
```

**Solução:**
```bash
# 1. Verificar DATABASE_URL no .env
cat .env | grep DATABASE_URL

# 2. Testar conexão manualmente
docker compose -f docker-compose.prod.yml exec postgres psql \
  -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT 1"

# 3. Aguardar startup do Postgres (pode levar ~30s)
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Frontend Não Conecta no Backend

**Erro no navegador:** "Failed to fetch" ou "CORS error"

```bash
# Verificar VITE_API_URL no .env
cat .env | grep -i vite

# Esperado: VITE_API_URL=https://evo-crm.seudominio.com/api
```

**Solução:**
1. Verificar se backend está saudável: `docker compose ps`
2. Verificar se CORS_ORIGINS está correto:
   ```bash
   cat .env | grep CORS_ORIGINS
   # Deve incluir o domínio do frontend
   ```
3. Testar backend direto:
   ```bash
   curl https://evo-crm.seudominio.com/api/health
   ```

### MinIO Não Salva Upload

```bash
docker compose -f docker-compose.prod.yml logs minio
docker compose -f docker-compose.prod.yml logs backend | grep -i minio
```

**Solução:**
```bash
# 1. Verificar volume
docker volume ls | grep minio

# 2. Verificar espaço em disco
df -h

# 3. Verificar permissões do volume
docker run --rm -v evo-crm_minio_data:/data alpine ls -la /data

# 4. Reiniciar MinIO
docker compose -f docker-compose.prod.yml restart minio
```

### Redis Não Conecta

```bash
docker compose -f docker-compose.prod.yml logs redis
```

**Solução:**
```bash
# Testar conexão
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
# Esperado: PONG

# Verificar dados persistidos
docker compose -f docker-compose.prod.yml exec redis redis-cli DBSIZE
```

### Domínio Sem SSL (Erro HTTPS)

**Problema:** Browser mostra "Conexão não segura"

```bash
# Verificar certificados do Traefik
docker compose -f docker-compose.prod.yml logs traefik | grep -i "cert\|acme\|ssl"
```

**Solução:**
1. Aguardar Let's Encrypt renovar (pode levar ~5 min)
2. Verificar se email do Traefik está correto:
   ```bash
   cat .env | grep TRAEFIK_EMAIL
   ```
3. Reiniciar Traefik:
   ```bash
   docker compose -f docker-compose.prod.yml restart traefik
   ```

### Container Reiniciando Continuamente

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs NOME_CONTAINER
```

**Soluções comuns:**
- Backend: aguardar Postgres estar saudável
- Postgres: verificar espaço em disco (`df -h`)
- Evolution API: verificar conectividade com WhatsApp

### Porta Ocupada (Erro "Address already in use")

```bash
# Verificar quem está usando a porta
lsof -i :80    # Frontend/Traefik
lsof -i :443   # Frontend/Traefik
lsof -i :5432  # Postgres
lsof -i :6379  # Redis
lsof -i :9000  # MinIO
lsof -i :8080  # Evolution API
lsof -i :3000  # Backend
```

**Solução:**
```bash
# Parar container anterior
docker compose -f docker-compose.prod.yml down

# Aguardar conexões TCP liberarem (pode levar ~60s)
sleep 60

# Subir novamente
docker compose -f docker-compose.prod.yml up -d
```

---

## Checklist de Entrega

### ✅ Pré-Deployment

- [ ] Docker e Docker Compose instalados
- [ ] Domínio apontado para o servidor
- [ ] Portas 80/443 liberadas no firewall
- [ ] Mínimo 6GB de RAM disponível
- [ ] Mínimo 50GB de disco SSD disponível

### ✅ Configuração

- [ ] `.env` copiado de `.env.example`
- [ ] `JWT_SECRET` gerado com openssl
- [ ] `JWT_REFRESH_SECRET` gerado com openssl
- [ ] `EVOLUTION_API_KEY` gerado com openssl
- [ ] `POSTGRES_PASSWORD` gerado com openssl
- [ ] `MINIO_ROOT_PASSWORD` gerado com openssl
- [ ] `TRAEFIK_DOMAIN` ajustado para o domínio real
- [ ] `TRAEFIK_EMAIL` ajustado (para Let's Encrypt)
- [ ] `CORS_ORIGINS` incluindo o domínio do frontend

### ✅ Deployment

- [ ] `docker compose -f docker-compose.prod.yml up -d --build` executado com sucesso
- [ ] Todos os 6 containers em estado "Up"
- [ ] Migrações do banco executadas (`npm run prisma:migrate:deploy`)
- [ ] Admin inicial criado (se aplicável)

### ✅ Validação

- [ ] Frontend carrega em `https://evo-crm.seudominio.com`
- [ ] Backend health OK em `https://evo-crm.seudominio.com/api/health`
- [ ] SSL/TLS funcionando (sem warnings no navegador)
- [ ] Login admin funciona
- [ ] QR Code gera corretamente
- [ ] Instância conecta no WhatsApp

### ✅ Módulos Validados

- [ ] Dashboard
- [ ] Admin > Usuários (CRUD)
- [ ] Admin > Instâncias (QR OK)
- [ ] Admin > Contatos (import Excel, export CSV)
- [ ] Admin > Mídia (upload funcionando)
- [ ] Admin > Content Groups (grupos dinâmicos)
- [ ] Admin > Templates (preview + simulação)
- [ ] Admin > Campanhas (draft + simulação)
- [ ] Inbox (conversas reais)
- [ ] Logs (registros de atividades)
- [ ] Configurações

### ✅ Segurança

- [ ] Senha admin trocada (não é "admin")
- [ ] `.env` com permissões restritas (`chmod 600 .env`)
- [ ] Backups configurados
- [ ] Logs habilitados
- [ ] CORS ajustado para domínios confiáveis

### ✅ Operacional

- [ ] Backup automático agendado (cron)
- [ ] Monitoramento de espaço em disco
- [ ] Plano de restore documentado
- [ ] Contato de emergência definido
- [ ] Documentação acessível

---

## Comandos Rápidos

```bash
# Parar tudo
docker compose -f docker-compose.prod.yml down

# Parar (sem remover volumes)
docker compose -f docker-compose.prod.yml stop

# Reiniciar
docker compose -f docker-compose.prod.yml restart

# Ver status
docker compose -f docker-compose.prod.yml ps

# Ver logs (últimas 100 linhas)
docker compose -f docker-compose.prod.yml logs --tail=100

# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs backend

# Executar comando no backend
docker compose -f docker-compose.prod.yml exec backend sh

# Remover volumes (CUIDADO: deleta dados!)
docker compose -f docker-compose.prod.yml down -v

# Rebuild de todas as images
docker compose -f docker-compose.prod.yml build --no-cache

# Subir com fresh build
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Suporte e Contato

Para problemas ou dúvidas:

1. Verificar esta documentação (section Troubleshooting)
2. Revisar logs: `docker compose logs -f`
3. Checar conectividade: `curl -v https://seu-dominio.com`
4. Verificar health dos serviços: `docker compose ps`

---

**ChipFire CRM v1.0.0 — Pronto para Produção ✅**

_Documento gerado em May 2026_
