# Checklist de Producao - ChipFire CRM

**Atualizado em:** 2026-05-22  
**Objetivo:** decidir se a versao atual pode sair de homologacao e receber uso real.

Este checklist complementa `README_DEPLOY.md`, `AUDITORIA_RESULTADO_FINAL.md` e `k8s/DEPLOY.md`.
Ele reflete o estado atual do repositorio, incluindo as correcoes locais de maturacao que ainda
precisam virar release.

## Regra de go-live

Nao promover para producao enquanto existir qualquer item aberto em **Bloqueadores**.

## Status atual

- [x] Backend compila com `npm run build --workspace apps/backend`.
- [x] Frontend compila com `npm run build --workspace apps/frontend`.
- [x] Compose de producao e manifests Kubernetes existem.
- [x] Fluxo de deploy esta documentado.
- [ ] Correcoes atuais de maturacao estao commitadas e publicadas.
- [x] Secrets reais foram removidos dos arquivos de deploy versionados.
- [ ] Credenciais expostas anteriormente foram rotacionadas no ambiente alvo.
- [x] Caminho K8s teve registry e imagens da release alinhados.
- [ ] Homologacao real de QR Code, campanhas e maturacao multimidia foi concluida.
- [ ] Suite e2e do backend foi executada com envs de producao/homologacao ou a excecao foi aceita formalmente.

## Bloqueadores

### 1. Fechar a release atual

- [ ] Revisar o diff local antes da release.
- [ ] Commitar as correcoes de maturacao e tela admin.
- [ ] Atualizar a versao que sera publicada.
- [x] Gerar as imagens de backend e frontend da mesma versao.
- [x] Publicar as imagens no registry usado pelo ambiente alvo.
- [ ] Registrar qual commit e quais tags foram implantados.

Observacao atual:

- Existem mudancas locais no backend e frontend para:
  - envio de audio na maturacao;
  - envio de video e demais midias no formato esperado pela Evolution API;
  - ativacao em lote da maturacao pelo admin para instancias conectadas.

### 2. Proteger secrets

- [x] Remover do fluxo versionado qualquer YAML com segredo real em texto puro.
- [ ] Rotacionar credenciais expostas em `k8s/01-secrets.yaml`.
- [ ] Usar Secret fora do Git, Sealed Secret ou outro mecanismo aprovado no cluster.
- [x] Confirmar que `.env` e `k8s/01-secrets.yaml` nao entram em novos commits.
- [ ] Validar que o repositorio nao contem novas senhas, tokens ou chaves reais.

### 3. Escolher o caminho de deploy

Escolher um:

- [ ] **Docker Compose** com `docker-compose.prod.yml`.
- [x] **Kubernetes** com `k8s/DEPLOY.md`.

Se o alvo for Kubernetes:

- [x] Alinhar registry e tags entre `build-push.ps1`, `k8s/DEPLOY.md` e manifests em `k8s/`.
- [ ] Confirmar namespace, Gateway, TLS, PostgreSQL, Redis, MinIO e PVCs do ambiente alvo.
- [ ] Confirmar que os manifests apontam para a imagem nova, nao para uma tag antiga.

Se o alvo for Docker Compose:

- [ ] Preparar `.env` de producao a partir de `.env.example`.
- [ ] Confirmar DNS e dominios usados por Traefik.
- [ ] Confirmar volumes persistentes e politica de backup do host.

## Preparacao de ambiente

- [ ] DNS do frontend aponta para o ambiente alvo.
- [ ] DNS da API aponta para o ambiente alvo quando separado.
- [ ] DNS da Evolution API aponta para o ambiente alvo quando exposta.
- [ ] HTTPS/TLS esta pronto para os dominios publicos.
- [ ] Portas publicas necessarias estao liberadas.
- [ ] PostgreSQL esta persistente e acessivel apenas pelo caminho aprovado.
- [ ] Redis esta configurado para o ambiente alvo.
- [ ] MinIO esta configurado, com bucket `evo-crm` disponivel.
- [ ] Evolution API esta com banco, cache e volume/sessao persistentes.
- [ ] CORS de producao nao inclui `localhost`.
- [ ] URLs publicas estao corretas:
  - [ ] `APP_URL`
  - [ ] `FRONTEND_URL`
  - [ ] `API_URL`
  - [ ] `EVOLUTION_API_URL_PUBLIC`
  - [ ] `MINIO_PUBLIC_URL`

## Seguranca minima

- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` sao novos e fortes.
- [ ] `EVOLUTION_API_KEY` e `EVOLUTION_WEBHOOK_SECRET` sao novos e fortes.
- [ ] Senhas de PostgreSQL, Redis e MinIO estao definidas conforme o ambiente.
- [ ] Usuario admin inicial troca a senha no primeiro acesso.
- [ ] Console MinIO nao fica exposto sem controle de acesso aprovado.
- [ ] Banco e Redis nao ficam publicados diretamente na internet.
- [ ] Backups nao carregam secrets em logs ou artefatos publicos.

## Homologacao funcional obrigatoria

### Aplicacao

- [ ] Frontend abre sem erro no dominio de homologacao.
- [ ] `GET /api/health` responde OK.
- [ ] Login admin funciona.
- [ ] Login usuario funciona.
- [ ] Dashboard abre com dados esperados.
- [ ] Logs registram operacoes principais.

### Instancias WhatsApp

- [ ] Criar uma instancia de teste.
- [ ] Gerar QR Code.
- [ ] Escanear QR Code.
- [ ] Status vira `CONNECTED`.
- [ ] Numero conectado aparece corretamente.
- [ ] Reconectar e desconectar foram testados com seguranca.

### Midia e templates

- [ ] Upload de imagem funciona.
- [ ] Upload de video funciona.
- [ ] Upload de audio funciona.
- [ ] Upload de documento/PDF funciona quando usado.
- [ ] Template de texto simples simula corretamente.
- [ ] Template com midia principal simula corretamente.
- [ ] Grupo dinamico retorna item valido.

### Campanhas

- [ ] Criar contato de teste com opt-in.
- [ ] Criar campanha em rascunho.
- [ ] Rodar dry-run/simulacao.
- [ ] Enviar 1 mensagem de texto para contato controlado.
- [ ] Enviar 1 midia para contato controlado.
- [ ] Confirmar MessageLog, status e erros.

### Maturacao

- [ ] Ativar maturacao por instancia na tela do usuario.
- [ ] Admin ativa maturacao em lote apenas para instancias `CONNECTED`.
- [ ] Maturacao envia texto.
- [ ] Maturacao envia imagem.
- [ ] Maturacao envia video.
- [ ] Maturacao envia audio.
- [ ] Logs da maturacao mostram tipo, template/grupo e erro quando houver.
- [ ] Limite diario, fila e proximo disparo foram conferidos.

### Inbox e webhooks

- [ ] Receber mensagem pelo webhook da Evolution API.
- [ ] Conversa aparece na Inbox.
- [ ] Status e logs ficam coerentes apos recebimento.
- [ ] Opt-out e regras de contato foram conferidos no fluxo previsto.

## Validacao tecnica antes do go-live

- [ ] Build de backend passou na versao exata da release.
- [ ] Build de frontend passou na versao exata da release.
- [ ] Migracoes Prisma aplicaram no ambiente alvo ou no clone de homologacao.
- [ ] Containers/pods ficaram saudaveis apos o deploy.
- [ ] Logs de backend, frontend e Evolution API nao mostram erro critico no startup.
- [ ] Healthchecks do ambiente alvo respondem.
- [ ] Backup foi executado.
- [ ] Restore foi ensaiado ou o procedimento foi aprovado.
- [ ] Plano de rollback aponta para a versao anterior conhecida.

### Pendencia tecnica conhecida hoje

- [x] Suite unitaria do backend passou com `npm test --workspace apps/backend -- --runInBand`.
- [ ] Executar `npm run test:e2e --workspace apps/backend -- --runInBand` com envs, banco e Evolution API de homologacao configurados ou registrar aceite de risco antes do go-live.

No estado atual, a suite e2e inicia a validacao de configuracao e para sem `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `DATABASE_URL`, `EVOLUTION_API_URL_INTERNAL`, `EVOLUTION_API_KEY`
e `EVOLUTION_WEBHOOK_SECRET` disponiveis neste workspace.

## Aprovacao final

- [ ] Responsavel tecnico aprovou a release.
- [ ] Responsavel operacional aprovou dominios, backups e monitoramento.
- [ ] Responsavel de produto aprovou a homologacao do fluxo WhatsApp.
- [ ] Janela de deploy foi combinada.
- [ ] Canal de suporte/rollback durante o deploy foi definido.

## Pos-deploy

- [ ] Frontend publico carrega sem warning de TLS.
- [ ] API publica responde health OK.
- [ ] Login admin funciona no ambiente final.
- [ ] QR Code gera no ambiente final.
- [ ] Uma instancia controlada conecta no ambiente final.
- [ ] Um envio controlado chega no WhatsApp.
- [ ] Backups estao agendados.
- [ ] Monitoramento de disco, logs e disponibilidade esta ativo.
- [ ] Versao implantada foi registrada.

## Decisao

Preencher no dia do deploy:

- **Release:** `________________`
- **Commit:** `________________`
- **Ambiente:** `Compose / Kubernetes`
- **Data:** `________________`
- **Aprovadores:** `________________`
- **Resultado:** `GO / NO-GO`
