# AUDITORIA DE FEATURES — ChipFire CRM

**Data:** May 11, 2026  
**Versão:** 1.0 (Análise Inicial)  
**Status:** 🔍 AUDITORIA COMPLETA (Sem implementação)

---

## ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Estado Atual do Sistema](#2-estado-atual-do-sistema)
3. [Mapa de Capabilities da Evolution API](#3-mapa-de-capabilities-da-evolution-api)
4. [Painel do Usuário - Ideias de Features](#4-painel-do-usuário---ideias-de-features)
5. [Dashboard de Saúde Operacional](#5-dashboard-de-saúde-operacional)
6. [Inbox Avançado](#6-inbox-avançado)
7. [Mensagens, Mídia e Personalização](#7-mensagens-mídia-e-personalização)
8. [Campanhas Avançadas](#8-campanhas-avançadas)
9. [Grupos e Stickers](#9-grupos-e-stickers)
10. [Segurança, Limites e Compliance](#10-segurança-limites-e-compliance)
11. [Matriz de Risco e Viabilidade](#11-matriz-de-risco-e-viabilidade)
12. [Priorização P0-P4](#12-priorização-p0-p4)
13. [Roadmap Sugerido](#13-roadmap-sugerido)
14. [Recomendações Finais](#14-recomendações-finais)

---

# 1. VISÃO GERAL

## O que é ChipFire?

ChipFire é uma plataforma profissional de **Gestão de Relacionamento via WhatsApp** (WhatsApp CRM) construída sobre a Evolution API v2.3.7.

**Stack Técnico:**
- Frontend: React + Vite (Vite)
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- Cache: Redis + BullMQ
- Mídia: MinIO
- Autenticação: JWT (Admin/User)
- Integração: Evolution API v2.3.7

**Versão Atual:** 1.0.0 (Fase de Estabilização)  
**Status:** MVP Funcional, pronto para evolução

---

## Princípios de Design

### ✅ Permitido e Recomendado:
- ✅ Comunicação autorizada (opt-in)
- ✅ Relacionamento profissional
- ✅ Atendimento ao cliente
- ✅ Suporte técnico
- ✅ Notificações legítimas
- ✅ Observabilidade operacional
- ✅ Qualidade de serviço
- ✅ Compliance LGPD/privacidade

### ❌ Proibido e Marcado como Alto Risco:
- ❌ Spam ou disparo em massa não autorizado
- ❌ Evasão de bloqueios do WhatsApp
- ❌ Bot desonesto (enganar usuário)
- ❌ Entrada automática em grupos sem consentimento
- ❌ Disparo com opt-out ignorado
- ❌ Bypass de políticas da plataforma
- ❌ Jailbreak de limites operacionais

---

# 2. ESTADO ATUAL DO SISTEMA

## Módulos Existentes e Status

| MÓDULO | STATUS | O QUE JÁ FAZ | O QUE FALTA | RISCO |
|--------|--------|-------------|------------|-------|
| **Autenticação** | ✅ Completo | JWT, Login, Admin/User roles, sessions | 2FA, Recovery codes | Baixo |
| **Instâncias WhatsApp** | ✅ Completo | Criar via QR Code, conectar, status, desconectar, reiniciar, deletar, logs | Reconexão automática, failover | Baixo |
| **Contatos** | ✅ Completo | CRUD, opt-in/opt-out, importação Excel, etiquetas, filtros | Busca avançada, dedup em batch | Baixo |
| **Mídia (MinIO)** | ✅ Completo | Upload imagem/vídeo/áudio/doc, slug, preview | Compressão, otimização, versionamento | Baixo |
| **Templates** | ✅ Completo | CRUD, preview WhatsApp, variáveis dinâmicas, tags | Editor WYSIWYG, biblioteca | Baixo |
| **Content Groups** | ✅ Completo | CRUD, múltiplos tipos (TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT), modos (RANDOM, SEQUENTIAL, WEIGHTED) | LEAST_USED, tracking histórico | Médio |
| **Campanhas** | ✅ Completo | Criar/editar/iniciar, contatos elegíveis, opt-in validação, limite diário, horários permitidos, fila BullMQ, logs, pausar | Agendar, clonar, relatório avançado, A/B | Médio |
| **Inbox** | ✅ Completo | Listar conversas, histórico, filtros básicos, webhook recebimento | Busca avançada, responder inline, tags avançadas, tranferência | Médio |
| **Logs** | ✅ Completo | Auditoria, filtros, eventos | Exportação avançada, análise | Baixo |
| **Dashboard Admin** | ✅ Completo | Visão geral, cards, status instâncias | Saúde operacional, comparação, trends | Médio |
| **Dashboard User** | ✅ Completo | Próprias instâncias, básico | Detalhado, gráficos, saúde | **OPORTUNIDADE** |
| **Settings** | ✅ Completo | Configurações globais, Evolution API | Backups, webhooks avançado | Baixo |
| **Permissões** | ✅ Completo | Admin/User roles, isolamento | Permissões granulares | Baixo |
| **Webhooks** | ✅ Completo | Recebimento eventos Evolution, salva WebhookEvent, parsear QR/status/mensagens | Webhook outbound custom, retry | Médio |

---

## Backend - Rotas Principais

```
AUTH:
  POST   /auth/login                        (login)
  POST   /auth/refresh                      (refresh token)
  POST   /auth/logout                       (logout)

USERS:
  POST   /users                             (admin: criar usuário)
  GET    /users                             (admin: listar)
  GET    /users/:id                         (admin: obter)
  PUT    /users/:id                         (admin: editar)
  DELETE /users/:id                         (admin: deletar)
  PATCH  /users/me/password                 (mudar própria senha)

INSTANCES:
  GET    /instances                         (listar próprias ou todas se admin)
  POST   /instances                         (criar)
  GET    /instances/:id/qrcode              (obter QR Code)
  GET    /instances/:id/status              (status)
  PUT    /instances/:id/reconnect           (reiniciar)
  PUT    /instances/:id/disconnect          (logout)
  DELETE /instances/:id                     (deletar)

CONTACTS:
  GET    /contacts                          (listar)
  POST   /contacts                          (criar)
  POST   /contacts/import                   (importar Excel)
  GET    /contacts/:id                      (obter)
  PUT    /contacts/:id                      (editar)
  DELETE /contacts/:id                      (deletar)
  PATCH  /contacts/:id/opt-status           (marcar opt-in/out)

MEDIA:
  GET    /media                             (listar)
  POST   /media/upload                      (upload)
  GET    /media/:id                         (obter metadados)
  DELETE /media/:id                         (deletar)

TEMPLATES:
  GET    /templates                         (listar)
  POST   /templates                         (criar)
  GET    /templates/:id                     (obter)
  PUT    /templates/:id                     (editar)
  DELETE /templates/:id                     (deletar)
  POST   /templates/:id/test                (preview com variáveis)

CONTENT-GROUPS:
  GET    /content-groups                    (listar)
  POST   /content-groups                    (criar)
  GET    /content-groups/:id                (obter)
  PUT    /content-groups/:id                (editar)
  DELETE /content-groups/:id                (deletar)
  POST   /content-groups/:id/items          (adicionar item)
  DELETE /content-groups/:id/items/:itemId  (remover item)

CAMPAIGNS:
  GET    /campaigns                         (listar)
  POST   /campaigns                         (criar)
  GET    /campaigns/:id                     (obter)
  PUT    /campaigns/:id                     (editar)
  DELETE /campaigns/:id                     (deletar)
  POST   /campaigns/:id/start               (iniciar)
  POST   /campaigns/:id/pause               (pausar)
  POST   /campaigns/:id/resume              (resumir)
  POST   /campaigns/:id/test                (simular 1 contato)
  GET    /campaigns/:id/logs                (logs)

CONVERSATIONS:
  GET    /conversations                     (inbox)
  GET    /conversations/:id/messages        (histórico)
  POST   /conversations/:id/messages        (enviar manual - opcional)

LOGS:
  GET    /logs                              (filtros)
  GET    /audit-logs                        (auditoria)

WEBHOOKS:
  POST   /webhooks/evolution                (receber eventos da Evolution API)

DASHBOARD:
  GET    /dashboard/overview                (cards principal)
  GET    /dashboard/health-history          (histórico saúde)

SETTINGS:
  GET    /settings                          (obter)
  PUT    /settings                          (atualizar)
```

---

## Frontend - Páginas e Componentes

```
LOGIN:
  /login                                    (LoginPage)

ADMIN:
  /admin/dashboard                          (AdminDashboard)
  /admin/users                              (AdminUsersPage)
  /admin/instances                          (AdminInstancesPage)
  /admin/contacts                           (AdminContactsPage)
  /admin/media                              (AdminMediaPage)
  /admin/templates                          (AdminTemplatesPage)
  /admin/content-groups                     (AdminContentGroupsPage)
  /admin/campaigns                          (AdminCampaignsPage)
  /admin/inbox                              (AdminInboxPage)
  /admin/logs                               (AdminLogsPage)
  /admin/settings                           (AdminSettingsPage)

USER:
  /user/dashboard                           (UserDashboard)
  /user/instances                           (UserInstancesPage)
  /user/inbox                               (UserInboxPage)
  /user/logs                                (UserLogsPage)
  /user/profile                             (UserProfilePage)
```

---

## Banco de Dados - Modelos Principais

```
User                    - Usuários do sistema (admin/user)
WhatsAppInstance        - Instâncias WhatsApp (QR Code, status, saúde)
Contact                 - Contatos autorizados (opt-in/out)
Conversation            - Conversas por instância+contato
Message                 - Mensagens recebidas (webhook)
MediaLibrary            - Mídias uploadeadas
MessageTemplate         - Templates de mensagem
ContentGroup            - Grupos de conteúdo (aleatório/sequencial)
Campaign                - Campanhas de disparo
CampaignContact         - Mapeamento contato→campanha
CampaignInstance        - Mapeamento instância→campanha
MessageLog              - Log de cada mensagem (enviada/recebida/erro)
WebhookEvent            - Eventos recebidos da Evolution API
HealthSnapshot          - Snapshots de saúde da instância (diário)
AuditLog                - Log de auditoria (ações de usuários)
GlobalSettings          - Configurações globais do sistema
```

---

## Serviços Especializados

```typescript
EvolutionService            - Integração Evolution API (endpoints)
InstancesService            - CRUD instâncias, QR Code, status
CampaignExecutionService    - Fila BullMQ, envio de campanhas
DynamicContentResolver      - Resolve variáveis em templates
HealthService               - Calcula saúde da instância
AuditService                - Logs de auditoria
WebhooksService             - Processa webhooks da Evolution
```

---

# 3. MAPA DE CAPABILITIES DA EVOLUTION API

## Instâncias WhatsApp

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | IMPLEMENTADO NO CHIPFIRE? |
|---------|-----------|----------|--------------|-------|---------------------------|
| Criar instância | ✅ Sim | `POST /instance/create` | Baixa | Baixo | ✅ Sim |
| Obter QR Code | ✅ Sim | `GET /instance/connect/{name}` | Baixa | Baixo | ✅ Sim |
| Status conexão | ✅ Sim | `GET /instance/connectionState/{name}` | Baixa | Baixo | ✅ Sim |
| Desconectar | ✅ Sim | `DELETE /instance/logout/{name}` | Baixa | Baixo | ✅ Sim |
| Reiniciar instância | ✅ Sim | `PUT /instance/restart/{name}` | Baixa | Baixo | ✅ Sim |
| Deletar instância | ✅ Sim | `DELETE /instance/delete/{name}` | Baixa | Baixo | ✅ Sim |
| Eventos de conexão | ✅ Sim | Webhook `CONNECTION_UPDATE` | Baixa | Baixo | ✅ Sim |
| Foto/Nome/Perfil | ✅ Sim | Webhook + profile endpoint | Média | Baixo | ⏳ Pode implementar |
| Reconexão automática | ✅ Sim | Via health check + restart | Média | Baixo | ⏳ Não (manual) |
| Failover múltiplas | ✅ Sim | N/A | Alta | Médio | ❌ Não |

---

## Envio de Mensagens

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | IMPLEMENTADO? |
|---------|-----------|----------|--------------|-------|---------------|
| Enviar texto | ✅ Sim | `POST /message/sendText/{instance}` | Baixa | **SEGURO** | ✅ Sim |
| Enviar imagem | ✅ Sim | `POST /message/sendMedia/{instance}` (type: image) | Média | **SEGURO** | ✅ Sim |
| Enviar vídeo | ✅ Sim | `POST /message/sendMedia/{instance}` (type: video) | Média | **SEGURO** | ✅ Sim |
| Enviar áudio | ✅ Sim | `POST /message/sendMedia/{instance}` (type: audio) | Média | **SEGURO** | ✅ Sim |
| Enviar documento | ✅ Sim | `POST /message/sendMedia/{instance}` (type: document) | Média | **SEGURO** | ✅ Sim |
| Enviar sticker | ✅ Sim | `POST /message/sendMedia/{instance}` (type: sticker) | Média | **SEGURO** | ⏳ Não (fácil) |
| Enviar localização | ⚠️ Parcial | Via webhook (receber), não há send confirmado | Média | **SEGURO** | ❌ Não |
| Enviar contato | ⚠️ Parcial | Via webhook (receber), send incerto | Média | **SEGURO** | ❌ Não |
| Enviar botão | ❌ Não (legacy) | Evolution API v2 não suporta | Alta | N/A | ❌ Não |
| Enviar lista | ❌ Não (legacy) | Evolution API v2 não suporta | Alta | N/A | ❌ Não |
| Enviar reação | ⚠️ Incerto | Pode haver via webhook | Média | **SEGURO** | ❌ Não |
| Marcar como lida | ⚠️ Incerto | Não há endpoint confirmado | Média | **SEGURO** | ❌ Não |
| Presença (digitando) | ✅ Sim | Via `options: {presence: 'composing'}` | Baixa | **SEGURO** | ✅ Sim |
| Link preview | ✅ Sim | Via `options: {linkPreview: true}` | Baixa | **SEGURO** | ✅ Sim |
| Quotar/Responder | ⚠️ Incerto | Pode ter suporte parcial | Média | **SEGURO** | ❌ Não |

---

## Recebimento de Mensagens

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | IMPLEMENTADO? |
|---------|-----------|----------|--------------|-------|---------------|
| Receber mensagem | ✅ Sim | Webhook `MESSAGES_UPSERT` | Baixa | **SEGURO** | ✅ Sim |
| Receber mídia | ✅ Sim | Webhook (image/video/audio/document) | Média | **SEGURO** | ✅ Sim (salva raw) |
| Baixar mídia | ⚠️ Incerto | Pode haver endpoint de download | Média | **SEGURO** | ❌ Não |
| Receber localização | ✅ Sim | Webhook | Baixa | **SEGURO** | ✅ Sim (raw) |
| Receber contato | ✅ Sim | Webhook | Baixa | **SEGURO** | ✅ Sim (raw) |
| Receber reação | ✅ Sim | Webhook | Baixa | **SEGURO** | ✅ Sim (raw) |
| Receber sticker | ✅ Sim | Webhook | Baixa | **SEGURO** | ✅ Sim (raw) |
| Status entrega | ✅ Sim | Webhook `MESSAGE_UPDATE` | Baixa | **SEGURO** | ✅ Sim (salva) |
| Status leitura | ✅ Sim | Webhook `MESSAGE_UPDATE` | Baixa | **SEGURO** | ✅ Sim (salva) |

---

## Inbox e Conversas

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | IMPLEMENTADO? |
|---------|-----------|----------|--------------|-------|---------------|
| Listar conversas | ✅ Sim (via mensagens) | Webhook | Baixa | **SEGURO** | ✅ Sim |
| Histórico contato | ✅ Sim | Message model | Baixa | **SEGURO** | ✅ Sim |
| Marcar como lida | ⚠️ Incerto | Pode não ter API | Média | **SEGURO** | ❌ Não |
| Arquivar conversa | ⚠️ Incerto | Pode haver via Evolution | Média | **SEGURO** | ❌ Não |
| Busca por telefone | ✅ Sim | SQL query | Baixa | **SEGURO** | ✅ Sim |
| Busca por texto | ⚠️ Parcial | SQL full-text search | Média | **SEGURO** | ⏳ Pode melhorar |
| Filtros por etiqueta | ✅ Sim | SQL + tag model | Baixa | **SEGURO** | ✅ Sim |
| Transferência humano | ✅ Sim (operacional) | Marcar na UI | Baixa | **SEGURO** | ⏳ Pode implementar |

---

## Grupos

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | RECOMENDADO? | IMPLEMENTADO? |
|---------|-----------|----------|--------------|-------|--------------|---------------|
| Listar grupos | ✅ Sim | Via webhook | Média | **MODERADO** | ⚠️ Com restrições | ❌ Não |
| Criar grupo | ✅ Sim | `POST /group/create` | Média | **ALTO RISCO** | ❌ Não recomendado | ❌ Não |
| Adicionar participante | ✅ Sim | `POST /group/add` | Média | **ALTO RISCO** | ❌ Evitar | ❌ Não |
| Remover participante | ✅ Sim | `POST /group/remove` | Média | **ALTO RISCO** | ❌ Evitar | ❌ Não |
| Alterar nome/foto | ✅ Sim | `POST /group/update` | Média | **ALTO RISCO** | ❌ Evitar | ❌ Não |
| Enviar msg grupo | ✅ Sim | `POST /message/sendText` (group ID) | Baixa | **ALTO RISCO** | ❌ Evitar | ❌ Não |
| Sair de grupo | ✅ Sim | `POST /group/leave` | Baixa | **MODERADO** | ⚠️ Usar com cuidado | ❌ Não |
| Monitorar grupo | ⚠️ Parcial | Webhook para grupos autorizado | Média | **SEGURO** | ✅ Sim | ⏳ Parcial |
| Entrar por convite | ❌ Não recomendado | Não deve automatizar | Alta | **ALTO RISCO** | ❌ NÃO | ❌ Não |
| Listar participantes | ✅ Sim | Via webhook | Baixa | **SEGURO** | ✅ Sim | ⏳ Não |

**⚠️ AVISO CRÍTICO SOBRE GRUPOS:**
- Adicionar pessoas em grupos sem consentimento = **SPAM e BLOQUEIO WHATSAPP**
- Envio em massa para grupos = **VIOLAÇÃO DE POLÍTICA**
- Criar grupos automaticamente = **Pode gerar suspeita de BOT**
- **RECOMENDAÇÃO:** Apenas suporte a monitoramento de grupos já autorizados

---

## Contatos

| FEATURE | SUPORTADO | ENDPOINT | COMPLEXIDADE | RISCO | IMPLEMENTADO? |
|---------|-----------|----------|--------------|-------|---------------|
| Verificar se existe | ✅ Sim | Via webhook | Baixa | **SEGURO** | ✅ Sim (implicit) |
| Buscar foto perfil | ✅ Sim | Via webhook + GET profilePicture | Média | **SEGURO** | ⏳ Não |
| Status online | ✅ Sim | Via webhook | Baixa | **SEGURO** | ⏳ Não |
| Última atividade | ✅ Sim | Via webhook | Baixa | **SEGURO** | ⏳ Não |
| Bloquear contato | ⚠️ Incerto | Pode haver API | Média | **SEGURO** | ❌ Não |
| Desbloquear | ⚠️ Incerto | Pode haver API | Média | **SEGURO** | ❌ Não |
| Salvar contato | ✅ Sim | ChipFire DB | Baixa | **SEGURO** | ✅ Sim |

---

## Webhooks

| EVENTO | SUPORTADO | TIPO | FREQ | IMPLEMENTADO? |
|--------|-----------|------|------|---------------|
| `QRCODE_UPDATED` | ✅ Sim | Conexão | 1-2x | ✅ Sim |
| `CONNECTION_UPDATE` | ✅ Sim | Conexão | Variável | ✅ Sim |
| `CONNECTION_STATE` | ✅ Sim | Conexão | 1x | ✅ Sim |
| `MESSAGES_UPSERT` | ✅ Sim | Mensagem | por msg | ✅ Sim |
| `MESSAGES_UPDATE` | ✅ Sim | Status msg | por update | ✅ Sim (salva) |
| `MESSAGE_DELETE` | ✅ Sim | Apaga msg | por delete | ✅ Sim (salva raw) |
| `CALL` | ✅ Sim | Chamada | por call | ✅ Sim (salva raw) |
| `SEND_MESSAGE` | ✅ Sim | Enviada | por envio | ✅ Sim (salva) |
| Webhook custom | ✅ Sim | Configurável | via .env | ⏳ Parcial |
| Retry automático | ⚠️ Incerto | Implementação | N/A | ❌ Não |
| Secret validation | ✅ Sim | Security | Sempre | ✅ Sim |

---

# 4. PAINEL DO USUÁRIO - IDEIAS DE FEATURES

Atualmente o painel do usuário é **básico**. Propomos evolução para **profissional e altamente observável**.

## 4.1 Cards Principais - Dashboard do Usuário

| CARD | MÉTRICA | DADOS NECESSÁRIOS | JÁ TEMOS? | COMPLEXIDADE | VALOR |
|------|---------|-------------------|----------|--------------|-------|
| Status da Instância | CONNECTED / DISCONNECTED / ERROR | WhatsAppInstance.status | ✅ Sim | Baixa | Alto |
| Tempo Online | Horas/Dias conectado | connectedAt, disconnectedAt | ✅ Sim | Baixa | Médio |
| Saúde Operacional | Score 0-100 | HealthSnapshot.score | ✅ Sim | Média | **Alto** |
| Mensagens Hoje (Enviadas) | Número | messagesSentToday | ✅ Sim | Baixa | Alto |
| Mensagens Hoje (Recebidas) | Número | messagesReceivedToday | ✅ Sim | Baixa | Alto |
| Total Contatos Únicos | Número | SELECT DISTINCT phone FROM contacts | ✅ Sim | Média | Médio |
| Total Respostas | Número | MessageLog WHERE direction=INBOUND | ✅ Sim | Baixa | Médio |
| Total Mídias Enviadas | Número | MessageLog WHERE type != TEXT | ✅ Sim | Média | Baixo |
| Total Textos Enviados | Número | COUNT(messages WHERE type=TEXT) | ✅ Sim | Baixa | Médio |
| Total Áudios Enviados | Número | COUNT(messages WHERE type=AUDIO) | ✅ Sim | Baixa | Baixo |
| Total Vídeos Enviados | Número | COUNT(messages WHERE type=VIDEO) | ✅ Sim | Baixa | Baixo |
| Total Docs Enviados | Número | COUNT(messages WHERE type=DOCUMENT) | ✅ Sim | Baixa | Baixo |
| Erros do Dia | Número | MessageLog WHERE status=ERROR, createdAt=today | ✅ Sim | Baixa | Alto |
| Opt-outs do Dia | Número | Contact WHERE optOutAt=today | ✅ Sim | Baixa | Alto |
| Última Atividade | Timestamp | lastActivityAt | ✅ Sim | Baixa | Médio |
| Campanhas Vinculadas | Número | CampaignInstance count | ✅ Sim | Baixa | Médio |
| Inbox Pendente | Número | Conversation count sem resposta | ✅ Sim | Média | Alto |

---

## 4.2 Saúde Operacional - Velocímetro (Gauge 0-100)

**Definição:** Métrica de observabilidade que indica a qualidade operacional da instância.  
**NÃO É:** Uma garantia de evitar bloqueios.

### Critérios (Peso):

| Critério | Peso | Como Calcular | Alerta Crítico |
|----------|------|---------------|----------------|
| Conexão Estável | 20% | `(uptime_horas / 24) * 100` | < 8 horas |
| Taxa de Erro Baixa | 15% | `100 - (erro_count / msg_sent) * 100` | > 10% |
| Taxa Opt-out Baixa | 15% | `100 - (optout_count / msg_sent) * 100` | > 5% |
| Mensagens Respondidas | 15% | `(resposta_count / msg_sent) * 100` | < 5% |
| Diversidade de Contatos | 10% | `(unique_contacts / total_sent) * 100` | < 20% |
| Uso Dentro de Limites | 10% | `(daily_sent / daily_limit) * 100` | > 90% |
| Regularidade Saudável | 10% | Consistência de padrão | Picos ou quedas |
| Sem Falhas Recentes | 5% | Dias sem erro crítico | Qualquer erro crítico |

### Classificações:

- **0-39:** 🔴 **Crítica** - Investigar imediatamente
- **40-59:** 🟡 **Atenção** - Monitorar de perto
- **60-79:** 🟢 **Boa** - Operação normal
- **80-100:** 💚 **Excelente** - Padrão ouro

### Exemplo de Cálculo:

```
Conexão:     18 horas online = 75% × 20 = 15 pts
Erro:        2% taxa         = 98% × 15 = 14.7 pts
Opt-out:     1% taxa         = 99% × 15 = 14.85 pts
Resposta:    25% respondidas = 25% × 15 = 3.75 pts
Contatos:    30% diversidade = 30% × 10 = 3 pts
Limites:     50% do limite   = 50% × 10 = 5 pts
Regularidade: constante      = 100% × 10 = 10 pts
Falhas:      0 críticas      = 100% × 5  = 5 pts

TOTAL: 15 + 14.7 + 14.85 + 3.75 + 3 + 5 + 10 + 5 = 71.3 → "BOA"
```

---

## 4.3 Gráficos Propostos

| GRÁFICO | TIPO | PERÍODO | VALOR | COMPLEXIDADE |
|---------|------|---------|-------|--------------|
| Mensagens por Hora | Line Chart | Últimas 24h | count(messages) | Baixa |
| Mensagens por Dia | Bar Chart | Últimos 7-30 dias | count(messages)/day | Baixa |
| Textos vs Mídias | Stacked Bar | Últimos 7 dias | count by type | Baixa |
| Enviados vs Recebidos | Pie/Donut | Últimas 24h | count by direction | Baixa |
| Contatos Únicos | Line Chart | Últimos 7-30 dias | count distinct phone | Média |
| Erros por Tipo | Bar Chart | Últimos 7 dias | count by errorType | Média |
| Opt-outs | Trend | Últimos 7-30 dias | count opt-outs/day | Baixa |
| Taxa de Resposta | Line | Últimos 7-30 dias | (inbound / outbound) % | Média |
| Saúde Operacional | Area | Últimos 7-30 dias | healthScore/day | Média |

---

## 4.4 Timeline de Eventos

Exibir historicamente:

```
2024-05-11 14:30   🟢 QR Code conectado (instância linked)
2024-05-11 14:35   📤 Campanha "Promoção" iniciada (5 contatos)
2024-05-11 14:36   ✅ 5 mensagens enviadas
2024-05-11 14:37   📨 1 resposta recebida (João Silva)
2024-05-11 14:38   ⚠️  1 erro de envio (taxa limite?)
2024-05-11 15:00   🔴 Instância desconectou
2024-05-11 15:01   🔃 Reconectando...
2024-05-11 15:02   🟢 Instância reconectada
2024-05-11 16:00   📤 Campanha "Follow-up" pausada manualmente
```

---

## 4.5 Alertas/Notificações

| ALERTA | TIPO | AÇÃO | CRITICIDADE |
|--------|------|------|-------------|
| Instância desconectada | Error | Notificar user, oferecer reconectar | Alta |
| Taxa de erro alta | Warning | Alertar tendência, sugerir pausa | Alta |
| Opt-out alto | Warning | Alertar, sugerir revisar contatos | Média |
| Sem respostas em N horas | Info | Informativo, sem ação | Baixa |
| Limite diário próximo | Warning | 80% do limite atingido | Média |
| QR expirado | Error | Oferecer renovação | Alta |
| Evolution API indisponível | Error | Notificar degradação | Crítica |

---

# 5. DASHBOARD DE SAÚDE OPERACIONAL

## 5.1 Widget Principal - Gauge da Saúde

```
┌─────────────────────────────────────┐
│     Saúde Operacional da Instância │
├─────────────────────────────────────┤
│                                      │
│         ╭───────────────╮           │
│        ╱                 ╲          │
│       │                   │         │
│      │  71 EXCELENTE!    │        │
│       │                   │         │
│        ╲                 ╱          │
│         ╰───────────────╯           │
│                                      │
│   Última atualização: há 5 min      │
│   Histórico: 7 dias disponível      │
└─────────────────────────────────────┘
```

### Detalhamento:

```
┌──────────────────────────────────────────────┐
│         Saúde Operacional Detalhado         │
├──────────────────────────────────────────────┤
│                                               │
│  ✅ Conexão Estável         18/24h (75%)    │
│  ✅ Taxa de Erro           2% (98 pts)      │
│  ✅ Taxa de Opt-out         1% (99 pts)     │
│  ⚠️ Respostas               25% (3 pts)     │
│  ✅ Diversidade Contatos    30% (3 pts)     │
│  ✅ Uso Dentro de Limites   50% (5 pts)     │
│  ✅ Regularidade            Constante       │
│  ✅ Sem Falhas              0 críticas      │
│                                               │
│  Score: 71.3 / 100 = EXCELENTE              │
│                                               │
│  💡 Dica: Aumentar taxa de resposta          │
│     para melhorar ainda mais o score        │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 5.2 Cards de Contexto

```
Ao lado do gauge, exibir:

┌─────────────────────┬──────────────────────┐
│ Mensagens Hoje:     │ 87 (Limite: 200)     │
│ Taxa de Erro:       │ 2 erros de 86 envios │
│ Opt-outs:           │ 0 hoje               │
│ Respostas:          │ 22 (25%)             │
│ Contatos Únicos:    │ 18 contatos          │
│ Última Atividade:   │ há 5 minutos         │
└─────────────────────┴──────────────────────┘
```

---

## 5.3 Histórico de Saúde (7/14/30 dias)

```
Score Saúde - Últimos 7 Dias
100 ┤
 90 ┤    ╭────────╮
 80 ┤   ╱          ╲
 70 ┤  ╱            ╰────╮
 60 ┤ ╱                   ╲
 50 ┤                      ╰───
  0 └───────────────────────────
    Dom Seg Ter Qua Qui Sex Sáb
    
Tendência: Estável com queda no sábado
```

---

# 6. INBOX AVANÇADO

## Histórico Melhorias

| FEATURE | MVP | IMPORTÂNCIA | COMPLEXIDADE | RISCO |
|---------|-----|-------------|--------------|-------|
| **Já Existe** | | | | |
| Listar conversas | ✅ | - | - | - |
| Histórico completo | ✅ | - | - | - |
| Filtros básicos | ✅ | - | - | - |
| **Propostas** | | | | |
| Inbox por instância | ⏳ | Alta | Baixa | Baixo |
| Inbox unificado | ⏳ | Alta | Baixa | Baixo |
| Busca avançada (telefone/nome/texto) | ⏳ | Alta | Média | Baixo |
| Filtros por etiqueta | ⏳ | Alta | Baixa | Baixo |
| Filtros por status (respondido/pendente) | ⏳ | Alta | Baixa | Baixo |
| Pré-visualização imagem inline | ⏳ | Alta | Média | Baixo |
| Pré-visualização áudio/vídeo | ⏳ | Média | Média | Baixo |
| Download de mídia recebida | ⏳ | Média | Baixa | Baixo |
| Responder manualmente inline | ⏳ | Alta | Média | **SEGURO** |
| Enviar texto pelo inbox | ⏳ | Alta | Média | **SEGURO** |
| Enviar mídia pelo inbox | ⏳ | Média | Média | **SEGURO** |
| Enviar áudio pelo inbox | ⏳ | Baixa | Média | **SEGURO** |
| Enviar sticker pelo inbox | ⏳ | Baixa | Média | **SEGURO** |
| Adicionar/Editar tag contato | ⏳ | Média | Baixa | Baixo |
| Marcar conversa como resolvida | ⏳ | Alta | Baixa | Baixo |
| Marcar como importante/star | ⏳ | Média | Baixa | Baixo |
| Atribuir conversa a usuário | ⏳ | Média | Média | Baixo |
| Notas internas (private notes) | ⏳ | Média | Baixa | Baixo |
| Opt-out manual (sem o contato solicitar) | ⏳ | Média | Baixa | **MODERADO** |
| Bloqueio de contato | ⏳ | Baixa | Média | **MODERADO** |
| Templates rápidos no inbox | ⏳ | Alta | Média | **SEGURO** |
| Respostas salvas (snippets) | ⏳ | Média | Baixa | **SEGURO** |
| Content group no atendimento | ⏳ | Média | Média | **SEGURO** |
| Exportar conversa (PDF/CSV) | ⏳ | Baixa | Média | Baixo |

---

## Classificação de MVP vs Futuro

### MVP (Sprint 2-3):
- Inbox por instância + unificado
- Busca avançada
- Filtros por etiqueta/status
- Pré-visualização imagem
- Responder manualmente
- Enviar texto/mídia
- Notas internas

### Importante (Sprint 3-4):
- Marcar como resolvido
- Atribuir conversa
- Templates rápidos
- Respostas salvas

### Futuro:
- Download em batch
- Exportar conversa
- Integração com CRM externo
- Bot de respostas automáticas

---

# 7. MENSAGENS, MÍDIA E PERSONALIZAÇÃO

## 7.1 Editor Avançado de Mensagens

| FEATURE | IMPLEMENTADO | COMPLEXIDADE | RISCO | NOTA |
|---------|--------------|--------------|-------|------|
| Editor WYSIWYG (Bold, Italic, Underline) | ⏳ | Média | Baixo | Preview real do WhatsApp |
| Inserir emoji | ✅ | Baixa | Baixo | Já tem |
| Quebra de linha | ✅ | Baixa | Baixo | Já tem |
| Variáveis dinâmicas `{{nome}}` | ✅ | Média | Baixo | Já tem |
| Content groups dinâmicos `{{grupo:tipo}}` | ✅ | Média | Baixo | Já tem |
| Preview com variáveis substituídas | ✅ | Média | Baixo | Já tem |
| Limite de caracteres (4096) | ⏳ | Baixa | Baixo | Avisar quando aproximar |
| Contador de caracteres | ⏳ | Baixa | Baixo | UI melhorada |
| Validação de variáveis | ✅ | Média | Baixo | Já valida |
| Histórico de drafts | ⏳ | Média | Baixo | Salvar automaticamente |

---

## 7.2 Biblioteca de Mídia - Propostas

| FEATURE | IMPLEMENTADO | COMPLEXIDADE | VALOR |
|---------|--------------|--------------|-------|
| Upload com slug | ✅ | Baixa | - |
| Preview imagem | ✅ | Baixa | - |
| Compressão automática imagem | ⏳ | Média | Alto |
| Otimização webp | ⏳ | Média | Médio |
| Redimensionamento | ⏳ | Média | Médio |
| Duração de áudio/vídeo | ⏳ | Média | Médio |
| Thumbnail de vídeo | ⏳ | Média | Médio |
| Versionamento de mídia | ⏳ | Média | Baixo |
| Histórico de uso | ⏳ | Média | Médio |
| Tags/Categorias | ⏳ | Média | Médio |
| Busca por tag | ⏳ | Baixa | Médio |
| Ordenação (nome, date, tamanho) | ⏳ | Baixa | Médio |

---

## 7.3 Content Groups Avançados

**Já Existe:**
- ✅ Criar grupos (TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, MIXED)
- ✅ Modos: RANDOM, SEQUENTIAL, WEIGHTED_RANDOM
- ✅ Inserir items com weight

**Propostas:**
- ⏳ Modo LEAST_USED - sempre usar o menos usado
- ⏳ Histórico de qual conteúdo foi usado
- ⏳ Analytics: qual conteúdo tem mais engajamento
- ⏳ Rotação inteligente por contexto
- ⏳ A/B Testing de conteúdo

---

## 7.4 Variáveis Dinâmicas - Referência Completa

```
// Variáveis de Contato
{{nome}}                    - Nome do contato
{{telefone}}               - Telefone (com DDI 55)
{{tag}}                    - Tag do contato
{{status}}                 - Status (ACTIVE, OPTOUT, etc)

// Variáveis de Data/Hora
{{data}}                   - Data de hoje (DD/MM/YYYY)
{{hora}}                   - Hora atual (HH:MM)
{{dia_semana}}             - Dia da semana (terça-feira)
{{mes}}                    - Mês por extenso (maio)
{{ano}}                    - Ano (2024)

// Variáveis de Saudação
{{saudacao}}               - "Olá", "Oi", "Bom dia", etc (por hora)
{{saudacao_formal}}        - "Prezado", "Prezada"

// Content Groups
{{grupo:saudacao}}         - Saudação aleatória do grupo
{{grupo:introducao}}       - Introdução aleatória
{{grupo:imagem_oferta}}    - Imagem aleatória de oferta
{{grupo:audio_intro}}      - Áudio aleatório de intro
{{grupo:video_demo}}       - Vídeo aleatório de demo
{{grupo:documento_manual}} - Documento aleatório

// Mídia Direta
{{midia:slug}}             - URL da mídia pelo slug
{{texto:slug}}             - Conteúdo de texto pelo slug
{{imagem:oferta_principal}} - Imagem específica
{{audio:intro_saudacao}}   - Áudio específico

// Variáveis de Campanha
{{campanha:nome}}          - Nome da campanha
{{campanha:data_inicio}}   - Data de início

// Variáveis de Instância (futura)
{{instancia:numero}}       - Número WhatsApp da instância
{{instancia:nome}}         - Nome da instância
```

---

## 7.5 Limites e Validações

| LIMITE | VALOR | POR QUE |
|--------|-------|--------|
| Tamanho máximo de mídia | 25MB (configurável) | WhatsApp limit |
| Duração máximo áudio | 16MB (~100s) | WhatsApp spec |
| Duração máximo vídeo | 25MB (~1-2 min) | WhatsApp spec |
| Resolução máxima imagem | 1920x1080 | Otimização |
| Número máximo de items em content group | Sem limite | Flexibilidade |
| Tamanho máximo de mensagem | 4096 caracteres | WhatsApp spec |

---

# 8. CAMPANHAS AVANÇADAS

## Histórico do que já existe

| FEATURE | STATUS | NOTA |
|---------|--------|------|
| CRUD campanhas | ✅ | Criar, editar, deletar |
| Seleção de contatos | ✅ | Com opt-in validação |
| Exclusão de opt-out | ✅ | Automática |
| Limite diário | ✅ | Por instância |
| Horários permitidos | ✅ | Start/end time |
| Pausa automática erro | ✅ | Se taxa > limiar |
| Pausa automática opt-out | ✅ | Se taxa > limiar |
| Logs por mensagem | ✅ | MessageLog detalhado |
| Simulação (1 contato) | ✅ | Teste sem enviar |
| Fila BullMQ | ✅ | Processamento assíncrono |

---

## Propostas de Melhorias

| FEATURE | COMPLEXIDADE | VALOR | RISCO | PRIORIDADE |
|---------|--------------|-------|-------|-----------|
| Clonar campanha | Baixa | Alto | Baixo | P1 |
| Agendar campanha (data/hora) | Média | Alto | Baixo | P1 |
| Calendário de campanhas | Média | Médio | Baixo | P2 |
| Pausar/Retomar manualmente | Baixa | Médio | Baixo | P1 |
| Relatório final (CSV export) | Média | Médio | Baixo | P2 |
| Estatísticas por campanha | Média | Alto | Baixo | P1 |
| Taxa de resposta | Média | Alto | Baixo | P1 |
| Taxa de erro | Baixa | Médio | Baixo | P1 |
| Taxa de opt-out | Baixa | Alto | Baixo | P1 |
| Comparação entre campanhas | Alta | Médio | Baixo | P3 |
| A/B Testing nativo | Alta | Alto | Médio | P3 |
| Campanhas por etiqueta | Baixa | Médio | Baixo | P2 |
| Campanhas por instância | Baixa | Médio | Baixo | P2 |
| Content groups em campanhas | Média | Alto | Baixo | P1 |
| Teste progressivo (small first) | Média | Médio | Baixo | P2 |
| Retry automático em erro | Média | Médio | Baixo | P2 |
| Webhook de callback ao terminar | Média | Baixo | Médio | P3 |
| Dashboard de progresso | Média | Alto | Baixo | P1 |

---

## Dashboard de Progresso da Campanha

```
┌────────────────────────────────────────┐
│  Campanha: Promoção Verão 2024        │
├────────────────────────────────────────┤
│                                        │
│  Status: EM PROGRESSO  [Pausar]      │
│                                        │
│  Processadas:    47 de 200            │
│  Sucesso:        45 ✅               │
│  Erro:           2 ⚠️                │
│  Pendentes:      153 ⏳               │
│                                        │
│  ████████░░░░░░░░░░░░░░░░ 23.5%      │
│                                        │
│  Taxa de erro:   4.3%                │
│  Taxa de resposta: 12%               │
│  Taxa opt-out:   2.1%                │
│                                        │
│  Tempo decorrido: 45 min              │
│  Tempo estimado: 3h 15min             │
│                                        │
│  Próximo envio: em 2 minutos          │
│                                        │
└────────────────────────────────────────┘
```

---

# 9. GRUPOS E STICKERS

## 9.1 Grupos - Risco Crítico

⚠️ **AVISO IMPORTANTÍSSIMO:**

A maioria das features de grupos deve ser **EVITADA** porque:

1. **Adicionar pessoas em grupos sem consentimento = SPAM**
   - Viola WhatsApp ToS
   - Pode gerar bloqueios
   - Causa desconexão/ban

2. **Enviar mensagens em grupos públicos = HIGH RISK**
   - Spam detection ativo
   - Grupos acham suspeito
   - Exclusão automática

3. **Criar grupos automaticamente = RED FLAG**
   - WhatsApp detecta padrão de bot
   - Conta pode ser sinalizada

### O que É Seguro com Grupos:

| FEATURE | SEGURO? | RAZÃO |
|---------|---------|-------|
| Monitorar grupo já autorizado | ✅ SEGURO | Apenas recebe eventos |
| Sair de grupo (via command) | ✅ SEGURO | Ação legítima |
| Receber mensagens de grupo | ✅ SEGURO | Passivo |
| Criar grupo INTERNO de equipe | ✅ SEGURO | Controle total |
| Adicionar com consentimento explícito | ⚠️ MODERADO | Apenas se autorizado |
| Criar grupo automaticamente | ❌ ALTO RISCO | Ban iminente |
| Enviar spam para grupo | ❌ NÃO FAZER | Bloqueio garantido |
| Adicionar números em massa | ❌ NÃO FAZER | Flagged como bot |

### Recomendação Final:

**NÃO IMPLEMENTAR** features de grupos automatizados. Se o usuário solicitar, oferecer apenas:
- Monitoramento de grupos autorizados
- Integração read-only
- Analytics de grupos onde usuário é participante

---

## 9.2 Stickers - Baixo Risco, Fácil Implementação

Stickers (figurinhas) são **SEGURO** enviar via Evolution API.

| FEATURE | IMPLEMENTADO | COMPLEXIDADE | VALOR |
|---------|--------------|--------------|-------|
| Enviar sticker | ⏳ | Baixa | Médio |
| Converter imagem → sticker | ⏳ | Média | Médio |
| Biblioteca de stickers | ⏳ | Média | Baixo |
| Upload sticker custom | ⏳ | Baixa | Baixo |
| Usar sticker em templates | ⏳ | Baixa | Médio |
| Usar sticker em inbox (resposta rápida) | ⏳ | Baixa | Médio |

---

# 10. SEGURANÇA, LIMITES E COMPLIANCE

## 10.1 O que Já Existe

- ✅ Opt-in obrigatório
- ✅ Opt-out automático
- ✅ JWT authentication
- ✅ Rate limiting (120 req/min)
- ✅ Webhook secret validation
- ✅ Audit logs
- ✅ Permissões Admin/User

---

## 10.2 Propostas de Hardening

| FEATURE | COMPLEXIDADE | VALOR | PRIORIDADE |
|---------|--------------|-------|-----------|
| **Autenticação** | | | |
| 2FA com TOTP | Média | Alto | P1 |
| WebAuthn/Passkeys | Alta | Alto | P2 |
| Recovery codes | Baixa | Médio | P1 |
| Session management | Média | Médio | P2 |
| Password policy (strength) | Baixa | Médio | P1 |
| Expiração de senha | Média | Médio | P2 |
| **Autorização** | | | |
| Permissões granulares (RBAC) | Alta | Alto | P3 |
| Org-level isolamento | Alta | Alto | P3 |
| Audit de acesso | Média | Médio | P2 |
| IP whitelist | Média | Médio | P2 |
| **Dados** | | | |
| Criptografia em repouso | Alta | Alto | P2 |
| Mascaramento de telefone em logs | Baixa | Alto | P1 |
| LGPD compliance | Média | Alto | P1 |
| Direito ao esquecimento (right-to-forget) | Média | Alto | P1 |
| Exportação de dados | Média | Médio | P2 |
| **API** | | | |
| Rate limit mais fino (per user) | Média | Médio | P2 |
| API key rotation | Baixa | Médio | P2 |
| API key scopes | Média | Médio | P2 |
| Throttling por endpoint | Média | Médio | P2 |
| **Webhooks** | | | |
| Retry automático | Média | Médio | P2 |
| Webhook logs | Baixa | Baixo | P3 |
| Custom webhook headers | Baixa | Médio | P3 |
| Webhook IP whitelist | Média | Médio | P2 |
| **Backup/DR** | | | |
| Backup automático diário | Média | Alto | P1 |
| Retenção de backup (30 dias) | Baixa | Médio | P2 |
| Restore point-in-time | Alta | Alto | P3 |
| Disaster recovery plan | Média | Alto | P3 |

---

## 10.3 LGPD Compliance

| ITEM | STATUS | AÇÃO |
|------|--------|------|
| Consentimento explícito | ✅ Opt-in | Documentado |
| Direito de acesso | ⏳ | Implementar export |
| Direito de retificação | ✅ | CRUD contatos |
| Direito ao esquecimento | ⏳ | Soft-delete ou anonimizar |
| Portabilidade | ⏳ | Export CSV/JSON |
| Notificação de breach | ⏳ | Protocolo de resposta |
| DPO (Data Protection Officer) | ⏳ | Designar ou contratar |
| Registro de processamento | ✅ | AuditLog salva |
| Política de privacidade | ⏳ | Publicar no site |
| Termos de uso | ⏳ | Publicar no site |

---

# 11. MATRIZ DE RISCO E VIABILIDADE

## Classificação de Risco

- 🟢 **SEGURO:** Implementar com confiança
- 🟡 **MODERADO:** Implementar com cuidado e validações
- 🔴 **ALTO RISCO:** Evitar ou ter governance muito forte
- ⚫ **NÃO RECOMENDADO:** Não implementar

---

## Tabela de Features com Risco/Viabilidade

| FEATURE | DESCRIÇÃO | RISCO | VIABILIDADE | DEPENDÊNCIA | RECOMENDAÇÃO |
|---------|-----------|-------|-------------|-------------|--------------|
| **Dashboard Usuario** | | | | | |
| Saúde Operacional (Gauge) | Score 0-100 da instância | 🟢 SEGURO | Alta | HealthSnapshot | ✅ P1 |
| Cards de Métrica | Mensagens, erros, contatos | 🟢 SEGURO | Alta | MessageLog | ✅ P1 |
| Gráficos de Atividade | Line/Bar charts | 🟢 SEGURO | Alta | MessageLog | ✅ P1 |
| Timeline de Eventos | Histórico ações | 🟢 SEGURO | Média | WebhookEvent | ✅ P1 |
| Alertas em Tempo Real | Notificações | 🟢 SEGURO | Média | WebSocket | ✅ P1 |
| **Inbox Avançado** | | | | | |
| Busca Avançada | Por telefone/nome/texto | 🟢 SEGURO | Média | Full-text search | ✅ P1 |
| Filtros por etiqueta | Tag filtering | 🟢 SEGURO | Baixa | Tag model | ✅ P1 |
| Responder Inline | Send message do inbox | 🟢 SEGURO | Média | Message API | ✅ P1 |
| Enviar Mídia | Do inbox | 🟢 SEGURO | Média | Media API | ✅ P1 |
| Notas Internas | Private comments | 🟢 SEGURO | Baixa | New model | ✅ P1 |
| Opt-out Manual | Desativar contato | 🟡 MODERADO | Baixa | Contact update | ⚠️ P2 |
| Bloqueio de Contato | Block contact | 🟡 MODERADO | Média | Evolution API uncertain | ⚠️ P3 |
| **Mensagens e Mídia** | | | | | |
| Editor WYSIWYG | Bold, italic, emoji | 🟢 SEGURO | Média | UI library | ✅ P1 |
| Compressão de Imagem | Auto-optimize | 🟢 SEGURO | Média | Sharp library | ✅ P2 |
| Variáveis Dinâmicas | {{nome}}, {{grupo:tipo}} | 🟢 SEGURO | Alta | DynamicContentResolver | ✅ P1 |
| Modo LEAST_USED | Contadores inteligentes | 🟢 SEGURO | Baixa | Counter tracking | ✅ P2 |
| Enviar Sticker | Figurinha | 🟢 SEGURO | Baixa | Evolution API | ✅ P2 |
| **Campanhas** | | | | | |
| Agendar Campanha | Data/hora futura | 🟢 SEGURO | Média | BullMQ delayed | ✅ P1 |
| Clonar Campanha | Duplicar config | 🟢 SEGURO | Baixa | CRUD operation | ✅ P1 |
| Dashboard Progresso | Status em tempo real | 🟢 SEGURO | Média | WebSocket | ✅ P1 |
| A/B Testing | Split audience | 🟡 MODERADO | Alta | Estatísticas avançadas | ⚠️ P3 |
| Relatório (CSV) | Export dados | 🟢 SEGURO | Baixa | CSV library | ✅ P2 |
| **Grupos** | | | | | |
| Monitorar Grupo | Read-only | 🟢 SEGURO | Média | Evolution API | ✅ P3 |
| Adicionar Participante | Add members | 🔴 ALTO RISCO | Média | Evolution API | ❌ NÃO FAZER |
| Criar Grupo | Auto-create | 🔴 ALTO RISCO | Baixa | Evolution API | ❌ NÃO FAZER |
| Enviar Mensagem Grupo | Broadcast | 🔴 ALTO RISCO | Baixa | Evolution API | ❌ NÃO FAZER |
| **Autenticação/Segurança** | | | | | |
| 2FA TOTP | Google Authenticator | 🟢 SEGURO | Média | TOTP library | ✅ P1 |
| Recovery Codes | Backup codes | 🟢 SEGURO | Baixa | Crypto | ✅ P1 |
| Password Policy | Strength rules | 🟢 SEGURO | Baixa | Validator | ✅ P1 |
| Mascaramento Telefone | Hide in logs | 🟢 SEGURO | Baixa | Transform util | ✅ P1 |
| LGPD Compliance | Right to forget | 🟡 MODERADO | Média | Data governance | ⚠️ P1 |
| Backup Automático | Diário | 🟢 SEGURO | Média | S3/MinIO | ✅ P1 |
| **Instâncias** | | | | | |
| Reconexão Automática | Auto-reconnect | 🟢 SEGURO | Média | Health check + restart | ✅ P2 |
| Failover Múltiplas | Switch to backup | 🟡 MODERADO | Alta | Multi-instance logic | ⚠️ P3 |
| Foto Perfil | Download profile pic | 🟢 SEGURO | Média | Evolution API | ✅ P2 |
| **Contatos** | | | | | |
| Dedup Batch | Remove duplicates | 🟢 SEGURO | Média | Algoritmo | ✅ P2 |
| Busca Avançada | Fuzzy search | 🟢 SEGURO | Média | Elasticsearch/Algolia | ✅ P3 |

---

# 12. PRIORIZAÇÃO P0-P4

## P0 — Correções/Essenciais Antes de Homologação

**Objetivo:** Estabilidade e compliance mínimo

```
[ ] 2FA TOTP para admin
[ ] Recovery codes
[ ] Mascaramento de telefone em logs
[ ] LGPD policy pública
[ ] Backup automático diário
[ ] Password policy obrigatória
[ ] Audit log completo
```

**Timeline:** 1-2 semanas

---

## P1 — Alto Impacto, Baixa Complexidade

**Objetivo:** Melhor observabilidade e UX

```
[ ] Dashboard do Usuário Avançado (Saúde + Gráficos)
[ ] Inbox Avançado (Busca, Filtros, Responder)
[ ] Campanhas: Agendar + Clonar + Dashboard Progresso
[ ] Relatório de Campanha (CSV)
[ ] Enviar Mídia/Áudio do Inbox
[ ] Notas Internas no Inbox
[ ] Editor WYSIWYG (Bold, Italic, Emoji)
[ ] Alertas em Tempo Real
[ ] Compressão de Imagem
```

**Timeline:** 4-6 semanas

---

## P2 — Impacto Médio, Complexidade Média

**Objetivo:** Profissionalismo e hardening

```
[ ] Reconexão Automática de Instâncias
[ ] Backup/Restore Point-in-Time
[ ] Foto de Perfil do Contato
[ ] Modo LEAST_USED em Content Groups
[ ] Permissões Granulares (RBAC)
[ ] Webhook Retry Automático
[ ] API Key Rotation
[ ] IP Whitelist
[ ] Exportação de Dados (LGPD)
[ ] Stickers Support
```

**Timeline:** 6-10 semanas

---

## P3 — Diferenciais Premium, Complexidade Alta

**Objetivo:** Vantagem competitiva

```
[ ] A/B Testing Nativo
[ ] Failover Múltiplas Instâncias
[ ] Integração Marketplace (Typebot, IA)
[ ] Análise Avançada (Cohort, Retention)
[ ] Custom Webhooks
[ ] Disaster Recovery Plan
[ ] Monitoramento de Grupos
[ ] SMS Gateway Integration (opcional)
```

**Timeline:** 10-16 semanas

---

## P4 — Longo Prazo / Pesquisa

```
[ ] Inteligência Artificial (Resposta Automática)
[ ] Computer Vision (Análise de Imagens)
[ ] NLU em Mensagens Recebidas
[ ] Previsão de Churn
[ ] Scoring de Leads
[ ] CRM Deep Integration
[ ] Blockchain para Auditoria
```

---

## NÃO RECOMENDADO — Evitar Completamente

```
❌ Adicionar Pessoas em Grupos Automaticamente
❌ Enviar Spam em Massa Sem Opt-in
❌ Criar Grupos Automaticamente
❌ Bot Enganoso (Esconder que é bot)
❌ Evasão de Bloqueios WhatsApp
❌ Jailbreak de Limites
❌ Simulação de Comportamento Humano
❌ Ignorar Opt-out
```

---

# 13. ROADMAP SUGERIDO

## Sprint 1 (Semana 1-2) — P0: Segurança e Compliance

**Goal:** Estabilidade antes de homologação

**Tasks:**
- [ ] Implementar 2FA TOTP
- [ ] Recovery codes
- [ ] Mascaramento telefone em logs
- [ ] LGPD compliance (policy, termos)
- [ ] Backup automático
- [ ] Password policy

**Entrega:** Sistema pronto para compliance

---

## Sprint 2 (Semana 3-4) — P1: Dashboard do Usuário

**Goal:** Observabilidade forte para usuário final

**Tasks:**
- [ ] Widget Saúde Operacional (Gauge 0-100)
- [ ] Cards de Métrica (mensagens, erros, contatos)
- [ ] Gráficos (Line, Bar charts)
- [ ] Timeline de eventos
- [ ] Alertas em tempo real (toasts/notificações)

**Entrega:** Dashboard profissional

---

## Sprint 3 (Semana 5-6) — P1: Inbox Avançado

**Goal:** Atendimento profissional

**Tasks:**
- [ ] Busca avançada (telefone, nome, texto)
- [ ] Filtros por etiqueta/status
- [ ] Responder manualmente (inline)
- [ ] Enviar texto/mídia do inbox
- [ ] Notas internas (private comments)
- [ ] Atribuir conversa a usuário

**Entrega:** Inbox como ferramenta de CRM

---

## Sprint 4 (Semana 7-8) — P1: Campanhas Avançadas

**Goal:** Controle fino de campanhas

**Tasks:**
- [ ] Agendar campanha (data/hora)
- [ ] Clonar campanha
- [ ] Dashboard de progresso em tempo real
- [ ] Relatório final (CSV export)
- [ ] Estatísticas (taxa erro, resposta, opt-out)
- [ ] Editor WYSIWYG para templates

**Entrega:** Campanhas profissionais

---

## Sprint 5 (Semana 9-10) — P1/P2: Mídia e Hardening

**Goal:** Qualidade de mídia + segurança

**Tasks:**
- [ ] Compressão de imagem automática
- [ ] Suporte a stickers
- [ ] Modo LEAST_USED em content groups
- [ ] Reconexão automática de instâncias
- [ ] Webhook retry automático
- [ ] IP whitelist

**Entrega:** Instâncias mais estáveis

---

## Sprint 6 (Semana 11-12) — P2: Compliance Profundo

**Goal:** LGPD + Segurança

**Tasks:**
- [ ] Exportação de dados (LGPD)
- [ ] Direito ao esquecimento (soft delete)
- [ ] Permissões granulares (RBAC)
- [ ] Auditoria de acesso
- [ ] Session management avançado
- [ ] Recover codes + 2FA full

**Entrega:** Sistema LGPD compliant

---

## Sprint 7+ — P3: Premium Features

```
Sprint 7: A/B Testing, Análise Avançada
Sprint 8: Failover, Integração Marketplace
Sprint 9: Monitoramento de Grupos (read-only)
Sprint 10: IA/NLU (opcional, pesquisa)
```

---

# 14. RECOMENDAÇÕES FINAIS

## O que Fazer Agora (MVP v1.1)

1. ✅ **Dashboard do Usuário Avançado** (Alto valor, baixa risco)
2. ✅ **2FA + Security Hardening** (Compliance)
3. ✅ **Inbox Avançado** (Diferencial)
4. ✅ **Campanhas: Agendar + Clonar** (Conveniência)

---

## O que Evitar Completamente

- ❌ **Qualquer automação com grupos**
- ❌ **Spam em massa**
- ❌ **Bots desonestos**
- ❌ **Ignorar opt-out**
- ❌ **Fake human behavior**

---

## Posicionamento no Mercado

ChipFire deve posicionar-se como:

> **"A plataforma profissional de WhatsApp CRM para relacionamento autorizado e observável"**

Não como:
- "Spam automatizado"
- "Bot infinito"
- "Evasão de bloqueios"
- "Mensagens enganosas"

---

## Principais Diferenciadores

1. **Saúde Operacional** - Score único que mede qualidade da instância
2. **Campanhas Inteligentes** - Content groups + variáveis + content selection
3. **Compliance-first** - LGPD, opt-in/out, auditoria completa
4. **Observabilidade** - Dashboard do usuário que mostra tudo em tempo real
5. **Sem spam** - Limites, horários, validações automáticas

---

## Métricas de Sucesso

```
MVP v1.0:     Funcional
MVP v1.1:     Observável + Seguro
MVP v1.2:     Premium + Inteligente
MVP v2.0:     Marketplace + IA opcional
```

---

# APÊNDICE A: Comparação com Concorrentes

| FEATURE | ChipFire | Concorrente A | Concorrente B |
|---------|----------|---------------|--------------|
| Dashboard Saúde | ✨ Novo | ❌ Não | ⚠️ Básico |
| Campanhas Agendadas | ✅ P1 | ✅ Sim | ✅ Sim |
| Content Groups | ✅ Avançado | ❌ Não | ⚠️ Limitado |
| LGPD Compliant | ✅ P1 | ❌ Não | ⚠️ Parcial |
| Stickers | ✅ P2 | ❌ Não | ❌ Não |
| A/B Testing | ✅ P3 | ✅ Sim | ❌ Não |
| Grupos (Safe) | ✅ P3 | ❌ Risco | ❌ Risco |

---

# APÊNDICE B: Glossário

- **Saúde Operacional:** Score 0-100 que mede qualidade/estabilidade da instância
- **Opt-in:** Consentimento explícito para receber mensagens
- **Opt-out:** Solicitação para parar de receber mensagens
- **Content Group:** Conjunto de conteúdos com seleção inteligente
- **MessageLog:** Registro de cada mensagem enviada/recebida
- **WebhookEvent:** Evento recebido da Evolution API
- **HealthSnapshot:** Captura diária de saúde da instância
- **BullMQ:** Fila de processamento para campanhas

---

**Versão:** 1.0  
**Data:** May 11, 2026  
**Status:** 🔍 Auditoria Completa (Sem Implementação)  
**Próximo Passo:** Aprovação para iniciar Sprint 1

