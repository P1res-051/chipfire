# EVO CRM — Central de Relacionamento WhatsApp com Evolution API

Plataforma web **SaaS/self-hosted** para relacionamento, atendimento, suporte, pós-venda, confirmação de interesse, comunicação com **contatos autorizados (opt-in)** e gestão operacional de instâncias WhatsApp via **Evolution API**.

> Este projeto **não** implementa nem incentiva spam, envio abusivo, automações para enganar o WhatsApp, “aquecimento/maturação” ou qualquer mecanismo de evasão/bypass.  
> A métrica “**Saúde Operacional**” existe apenas para observabilidade e qualidade operacional.

## Stack

**Backend**
- Node.js 20+
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- Redis + BullMQ
- JWT (access + refresh) + bcrypt
- Zod (validação)
- Multer (upload)
- XLSX (importação de Excel)
- Webhooks Evolution API

**Frontend**
- React + Vite + TypeScript
- TailwindCSS + shadcn/ui
- TanStack Query + Zustand
- React Hook Form + Zod
- Recharts, Lucide
- Tema dark premium (preto/neon)

**Infra**
- Docker Compose (dev + prod)
- Traefik (prod) com HTTPS automático (Let’s Encrypt)
- MinIO (mídia)
- Healthchecks, logs e volumes persistentes

## Estrutura de pastas

```
/evo-crm
  /apps
    /frontend
    /backend
  /infra
    /docker
    /nginx
    /traefik
    /scripts
  /storage
    /uploads
  docker-compose.yml
  docker-compose.prod.yml
  .env.example
  README.md
```

## Requisitos
- Docker + Docker Compose
- Domínio(s) apontados para seu servidor (produção)

## 1) Configuração inicial

1. Copie o arquivo de variáveis:
   ```bash
   cp .env.example .env
   ```
2. Edite `.env` com seus valores (senhas, domínios, secrets).

## 2) Subir em DESENVOLVIMENTO (sem proxy / sem HTTPS)

```bash
docker compose up -d --build
```

Acessos padrão (dev):
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api`
- Evolution API: `http://localhost:8080`
- MinIO Console: `http://localhost:9001`

## 2.1) Versão LOCAL (recomendado para testar tudo antes do servidor)

1. Copie o arquivo local:
   ```bash
   cp .env.local.example .env
   ```
2. Suba o stack local (com hot-reload e migrações automáticas no backend):
   ```bash
   docker compose -f docker-compose.local.yml up -d --build
   ```

Observação: na primeira subida, o backend executa `prisma migrate deploy` automaticamente.
Se você já subiu antes e criou volumes sem as migrações, rode uma vez:
```bash
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
```

### Windows (PowerShell) — se scripts estiverem bloqueados
Se o PowerShell bloquear execução de `.ps1`, rode o script assim (apenas esta execução):
```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\local-dev.ps1
```

## 3) Subir em PRODUÇÃO com HTTPS (Traefik)

### DNS
Crie apontamentos **A** para o IP da VPS:
- `TRAEFIK_DOMAIN` (ex.: `evo-crm.seudominio.com`) → aponta para a VPS
- `TRAEFIK_EVOLUTION_DOMAIN` (ex.: `evolution-api.seudominio.com`) → aponta para a VPS
- `TRAEFIK_MINIO_DOMAIN` (ex.: `minio.seudominio.com`) → aponta para a VPS

### Subir
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4) Admin padrão (primeiro start)

Ao iniciar o backend pela primeira vez, um admin padrão é criado se não existir:
- **email:** `admin@local.com`
- **senha:** `Admin@123456`

No primeiro login, o sistema exige **troca de senha**.

## 5) Evolution API

O container da Evolution API usa autenticação via `apikey` (header), configurada pela env:
- `EVOLUTION_API_KEY` (no Evo CRM)
- `AUTHENTICATION_API_KEY` (no container da Evolution API, via compose)

O Evo CRM se comunica com a Evolution API por HTTP (URL interna em rede Docker).

Referência oficial (Docker):  
https://doc.evolution-api.com/v1/en/install/docker

## 6) Importação de contatos (Excel)

Formato obrigatório:
```
NOME | TELEFONE | ETIQUETA
```

Antes de importar, o usuário/admin deve confirmar:
> “Confirmo que estes contatos autorizaram o recebimento de mensagens.”

Regras de validação (MVP):
- aceita número BR com DDI 55
- remove caracteres inválidos
- valida tamanho mínimo
- remove duplicados
- exige opt-in
- suporta tags/etiquetas
- suporta opt-out

## 7) Campanhas controladas (opt-in)

Regras:
- enviar apenas para `opt_in=true` e `status=active`
- nunca enviar para `opt_out`
- respeitar horário permitido e limites diários
- registrar logs
- pausa automática se taxa de erro/opt-out ultrapassar o limite configurado

## 8) Webhook Evolution API

Endpoint (backend):
```
POST /api/webhooks/evolution
```

Proteção:
- assinatura/segredo via `EVOLUTION_WEBHOOK_SECRET`

Ao receber eventos, o backend:
- identifica instância e usuário dono
- salva mensagens e eventos
- aplica opt-out quando necessário
- atualiza dashboards e saúde operacional
- enfileira processamento (BullMQ)

## 9) Backup / Restore (PostgreSQL)

Scripts:
- `infra/scripts/backup.sh`
- `infra/scripts/restore.sh`

> Em produção, recomenda-se agendar backups (cron) e armazenar em local seguro.

## 10) Nginx Proxy Manager (alternativa)

Se você já usa Nginx Proxy Manager, pode:
- desativar o Traefik no `docker-compose.prod.yml`
- expor portas 80/443 no NPM e apontar para os serviços internos

## Troubleshooting
- Ver logs:
  ```bash
  docker compose logs -f backend
  docker compose logs -f frontend
  docker compose logs -f evolution-api
  ```
- Checar health:
  ```bash
  docker compose ps
  ```
