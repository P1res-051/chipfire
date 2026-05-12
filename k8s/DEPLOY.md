# Deploy ChipFire — Namespace pires | k8s SP (proxmox-sp 187.110.174.213)

## Ambiente confirmado

| Componente | Valor |
|---|---|
| Contexto kubectl | `k8s-sp1` |
| Namespace | `pires` (já existe) |
| Gateway | `eg` no namespace `default` (Envoy Gateway) |
| Listener automation | `https-automation` → `*.automation.app.br` |
| TLS | cert-manager Cloudflare wildcard (já configurado) |
| StorageClass | `azure-file-sc` (Standard_LRS, Retain, Immediate) |
| PostgreSQL | pg-sp1 interno: `10.1.0.200:5432` |
| MinIO | `minio.evolution.svc.cluster.local:9000` |
| Secrets | Bitnami Sealed Secrets (cluster) |

## Passo 1 — Configurar kubectl

```bash
kubectl config use-context k8s-sp1
```

## Passo 2 — Preencher os secrets

Edite `01-secrets.yaml` com os valores reais:

```bash
# Gerar JWT secrets
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # JWT_REFRESH_SECRET

# Gerar Evolution API keys
openssl rand -hex 16      # EVOLUTION_API_KEY
openssl rand -hex 32      # EVOLUTION_WEBHOOK_SECRET
```

Preencher:
- `POSTGRES_PASSWORD` → senha do usuário `evo` no pg-sp1
- `DATABASE_ADMIN_URL` → `postgresql://postgres:SENHA@chipfire-postgres:5432/postgres`
- Imagens Docker Hub já configuradas: `alecmoura10/chipfire-backend:v1.0.0` e `alecmoura10/chipfire-frontend:v1.0.0`

## Passo 3 — (Opcional) Selar os secrets com Sealed Secrets

```bash
# Instalar kubeseal se não tiver:
# https://github.com/bitnami-labs/sealed-secrets#kubeseal

kubeseal --context k8s-sp1 --format yaml \
  < k8s/01-secrets.yaml \
  > k8s/01-sealedsecrets.yaml

# Commitar apenas o 01-sealedsecrets.yaml (valores cifrados)
# Nunca commitar o 01-secrets.yaml com valores reais
```

## Passo 4 — Criar bucket no MinIO (somente primeiro deploy)

O bucket `evo-crm` não existe ainda no MinIO do namespace `evolution`.

```bash
kubectl exec -n evolution minio-0 -- sh -c "
  mc alias set local http://localhost:9000 evolution_admin 'aCWnJU4J3u5x8GiHaUcrcMzbwzmqKic' &&
  mc mb local/evo-crm &&
  mc anonymous set download local/evo-crm
"
```

## Passo 5 — Deploy em ordem

```bash
# Conferir contexto
kubectl config current-context  # deve ser k8s-sp1

# 1. Secrets e ConfigMap
kubectl apply -f k8s/01-secrets.yaml     # ou 01-sealedsecrets.yaml se sellado
kubectl apply -f k8s/02-configmap.yaml

# 2. Services externos (Postgres + MinIO)
kubectl apply -f k8s/03-postgres-svc.yaml
kubectl apply -f k8s/04-minio-svc.yaml

# 3. Redis
kubectl apply -f k8s/redis/

# 4. Criar banco 'evolution' no PostgreSQL (APENAS no primeiro deploy)
kubectl apply -f k8s/jobs/init-evolution-db.yaml
kubectl wait --for=condition=complete job/init-evolution-db -n pires --timeout=90s
kubectl logs -n pires job/init-evolution-db

# 5. Evolution API
kubectl apply -f k8s/evolution-api/pvc.yaml
kubectl apply -f k8s/evolution-api/deployment.yaml
kubectl apply -f k8s/evolution-api/service.yaml
kubectl wait --for=condition=available deployment/chipfire-evolution -n pires --timeout=120s

# 6. Backend (initContainer roda migrate automaticamente)
kubectl apply -f k8s/backend/pvc.yaml
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml
kubectl apply -f k8s/backend/hpa.yaml
kubectl wait --for=condition=available deployment/chipfire-backend -n pires --timeout=120s

# 7. Frontend
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/service.yaml
kubectl apply -f k8s/frontend/hpa.yaml

# 8. HTTPRoutes (Gateway API — Envoy Gateway)
kubectl apply -f k8s/gateway/

# 9. Status final
kubectl get all -n pires
kubectl get httproute -n pires
kubectl get hpa -n pires
```

## Verificação pós-deploy

```bash
# Pods rodando
kubectl get pods -n pires

# Logs do migrate (initContainer)
kubectl logs -n pires deployment/chipfire-backend -c prisma-migrate

# Logs do backend
kubectl logs -n pires deployment/chipfire-backend -c backend --tail=50

# Health do backend
kubectl exec -n pires deployment/chipfire-backend -- \
  node -e "require('http').get('http://localhost:3000/api/health',r=>console.log('status:',r.statusCode))"

# HTTPRoutes aceitas pelo Gateway
kubectl describe httproute -n pires

# HPA
kubectl get hpa -n pires
```

## URLs finais

| Serviço | URL |
|---|---|
| Frontend | https://chipfire.automation.app.br |
| Backend API | https://chipfire-api.automation.app.br |
| Evolution API | https://evolution-api.automation.app.br |

## Rollback rápido

```bash
kubectl delete -f k8s/gateway/
kubectl delete -f k8s/frontend/
kubectl delete -f k8s/backend/
kubectl delete -f k8s/evolution-api/
# Redis e PVCs: deletar manualmente se necessário (cuidado com dados)
```
