# ANÁLISE TÉCNICA — Migração Evolution API → Evolution Go

**Data:** May 11, 2026  
**Status:** 🔍 ANÁLISE COMPLETA (Sem implementação ainda)  
**Fase:** 1 de 7 (Análise e Planejamento)

---

## Resumo Executivo

### O que é Evolution Go?

Evolution Go é uma reescrita **de alto desempenho em Go** da Evolution API (Node.js). Mantida pela Evolution Foundation, oferece:

- ✅ Compatibilidade de endpoints REST com Evolution API
- ✅ Suporte a PostgreSQL + Redis (igual atual)
- ✅ Webhooks, WebSocket, AMQP, NATS
- ✅ QR Code nativo
- ✅ MinIO/S3 para mídia
- ✅ Licença integrada (Manager UI)
- ✅ Menor consumo de recursos (Go vs Node.js)
- ⚠️ **Requer licença e ativação** (novo!)
- ⚠️ Banco de dados separado (auth + users)

---

## TABELA 1 — Endpoints Usados Hoje (Evolution API v2.3.7)

| FUNÇÃO | ENDPOINT ATUAL | PAYLOAD ATUAL | RESPOSTA ATUAL | ARQUIVO CHIPFIRE |
|--------|---|---|---|---|
| **Criar Instância** | `POST /instance/create` | `{instanceName, token, qrcode, integration, number?, webhook?, webhook_by_events, events}` | `{instance, qrcode?, base64?, status}` | `instances.service.ts` / `evolution.service.ts` |
| **Obter QR Code** | `GET /instance/connect/{instanceName}` | Sem body | `{qrcode: "data:image/png;base64,...", instance?, base64?}` | `instances.service.ts` → `normalizeQr()` |
| **Status da Conexão** | `GET /instance/connectionState/{instanceName}` | Sem body | `{instance: {instanceName, state: "open\|close"}}` | `instances.service.ts::getStatus()` |
| **Desconectar/Logout** | `DELETE /instance/logout/{instanceName}` | Sem body | `{instance?, status?}` | `instances.service.ts::disconnect()` |
| **Reiniciar/Reconectar** | `PUT /instance/restart/{instanceName}` | `{}` | `{instance?, status?}` | `instances.service.ts::reconnect()` |
| **Enviar Texto** | `POST /message/sendText/{instanceName}` | `{number, textMessage: {text}, options: {presence, linkPreview}}` | `{id?, status?, key?}` | `campaign-execution.service.ts` linha 250 |
| **Enviar Mídia** | `POST /message/sendMedia/{instanceName}` | `{number, mediaMessage: {mediaType, fileName, caption, media}, options}` | `{id?, status?, key?}` | `campaign-execution.service.ts` linha 241 |
| **Deletar Instância** | `DELETE /instance/delete/{instanceName}` | Sem body | `{instance?, status?}` | `instances.service.ts::delete()` |
| **Webhook de Eventos** | `POST /webhooks/evolution` | `{instance?, data?, qrcode?, state?, message?, key?, ...}` | `{ok: true, webhookEventId}` | `webhooks.controller.ts` |
| **Autenticação (Header)** | `apikey: {EVOLUTION_API_KEY}` | Via header | Validação JWT/apikey | Todos os endpoints |

---

## TABELA 2 — Comparação com Evolution Go (v0.7.0)

| FUNÇÃO | ENDPOINT EVOLUTION GO | PAYLOAD GO | RESPOSTA GO | COMPATÍVEL? | AJUSTE NECESSÁRIO |
|--------|---|---|---|---|---|
| **Criar Instância** | `POST /instance/create` | `{instanceName, token?, qrcode?, integration?, number?, webhook?, webhook_by_events?, events?}` | `{instance, qrcode?, base64?, status}` | ✅ **SIM** | Nenhum (mesma estrutura) |
| **Obter QR Code** | `GET /instance/{name}/qrcode` | Sem body | `{qrcode: "data:image/png;base64,..."}` | ⚠️ **PARCIAL** | URL **diferente**: `/instance/{name}/qrcode` vs `/instance/connect/{name}` |
| **Status da Conexão** | `GET /instance/{name}/status` | Sem body | `{instance: {state: "open\|close"}}` | ✅ **SIM** | URL similar, resposta compatível |
| **Desconectar** | `DELETE /instance/{name}/logout` | Sem body | `{status}` | ✅ **SIM** | URL padrão REST |
| **Reiniciar** | `POST /instance/{name}/restart` | `{}` | `{status}` | ⚠️ **PARCIAL** | **POST vs PUT** (Evolution API usa PUT) |
| **Enviar Texto** | `POST /message/sendText/{instanceName}` | `{to, text, options?}` | `{id?, status?, key?}` | ⚠️ **PARCIAL** | Payload **diferente**: `{to, text}` vs `{number, textMessage: {text}, options}` |
| **Enviar Mídia** | `POST /message/sendMedia/{instanceName}` | `{to, type, fileName, caption?, media}` | `{id?, status?, key?}` | ⚠️ **PARCIAL** | Payload **diferente**: `{to, type}` vs `{number, mediaMessage: {mediaType}}` |
| **Deletar Instância** | `DELETE /instance/{name}` | Sem body | `{status}` | ✅ **SIM** | Compatível |
| **Webhook de Eventos** | `POST /webhook` (configurável) | JSON com `instanceName, event, data` | `{ok}` | ✅ **SIM** | Necessário ajustar caminho e parser |
| **Autenticação (Header)** | `Authorization: Bearer {TOKEN}` ou `apikey: {GLOBAL_API_KEY}` | Via header (`apikey` ou `Authorization`) | Validação nativa | ⚠️ **PARCIAL** | Suporta `apikey` e `Authorization` (flexível) |

### Diferenças Críticas Encontradas:

1. **QR Code endpoint**: `/instance/connect/{name}` → `/instance/{name}/qrcode`
2. **Restart method**: `PUT /instance/restart` → `POST /instance/{name}/restart`
3. **Send Text payload**: `{number, textMessage: {text}}` → `{to, text}`
4. **Send Media payload**: `{number, mediaMessage: {...}}` → `{to, type, fileName, caption, media}`
5. **Webhook path**: Configurável (não padrão como Evolution API)
6. **Banco de dados**: Requer 2 conexões PostgreSQL (auth + users), não apenas 1

---

## TABELA 3 — Riscos da Migração

| RISCO | IMPACTO | SEVERIDADE | COMO MITIGAR |
|-------|---------|-----------|---|
| **QR Code endpoint diferente** | Instâncias não conseguem obter QR Code (login falha) | 🔴 CRÍTICO | Criar abstração no adapter (manter normalização) |
| **Payload incompatível (sendText/sendMedia)** | Mensagens não enviadas ou erro 400 | 🔴 CRÍTICO | Adapter converte estrutura (transformação de payload) |
| **Licença obrigatória** | Evolution Go retorna 503 até ativar (sem API) | 🔴 CRÍTICO | Planejar ativação + heartbeat automático na infraestrutura |
| **Banco de dados separado (auth)** | Requer 2 PostgreSQL ou 2 schemas | 🟠 ALTO | Usar docker-compose com 2 DB ou schema isolation |
| **Método HTTP diferente (PUT vs POST restart)** | Erro 405 se não ajustar | 🟠 ALTO | Adapter abstrai, backend pode usar ambos |
| **Webhooks não padronizados** | Eventos não chegam ou formato diferente | 🟠 ALTO | Configurar URL webhook corretamente + parser flexível |
| **Consumo de recursos reduzido** | Benefício (Go é mais leve) | 🟢 POSITIVO | Aproveitar redução de CPU/RAM |
| **Sem migrations na Evolution Go** | Não há histórico de schema Evolution | 🟡 MÉDIO | Manter backup do DB Evolution API antes de migrar |
| **Redis cache diferente** | Chaves/estrutura pode ser diferente | 🟡 MÉDIO | Limpar Redis antes de ativar Evolution Go |
| **Sessões persistentes** | QR Code salvo em `evolution_instances` volume | 🟡 MÉDIO | Migração de volume `evolution_instances` ou reiniciar |

---

## ANÁLISE DETALHADA POR FUNÇÃO

### 1. Criar Instância (createInstance)

**Evolution API (Atual):**
```typescript
POST /instance/create
{
  instanceName: "user@123",
  token: "",
  qrcode: true,
  integration: "WHATSAPP-BAILEYS",
  number?: "5511999999999",
  webhook: "https://...",
  webhook_by_events: true,
  events: ["QRCODE_UPDATED", "CONNECTION_UPDATE"]
}
```

**Evolution Go (Novo):**
```
POST /instance/create
{
  instanceName: "user@123",
  token?: "",
  qrcode?: true,
  integration?: "WHATSAPP-BAILEYS",
  number?: "5511999999999",
  webhook?: "https://...",
  webhook_by_events?: true,
  events?: ["QRCODE_UPDATED", "CONNECTION_UPDATE"]
}
```

**Status:** ✅ **Compatível** (mesmo schema, todos os campos opcionais em Go)  
**Impacto:** Zero (sem mudança de código)

---

### 2. QR Code (getQRCode)

**Evolution API (Atual):**
```
GET /instance/connect/{instanceName}
Resposta: {qrcode, base64, ...}
```

**Evolution Go (Novo):**
```
GET /instance/{instanceName}/qrcode
Resposta: {qrcode, base64?, ...}
```

**Status:** ⚠️ **Incompatível** (URL diferente)  
**Impacto:** Alto (todos os clientes que fazem GET /instance/connect/ param quebram)

**Solução via Adapter:**
```typescript
// EvolutionApiProvider
async getQRCode(instanceName: string) {
  return this.http.get(`${this.baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`, ...);
}

// EvolutionGoProvider
async getQRCode(instanceName: string) {
  return this.http.get(`${this.baseUrl}/instance/${encodeURIComponent(instanceName)}/qrcode`, ...);
}

// WhatsAppProvider interface (abstrata)
abstract getQRCode(instanceName: string): Promise<QRResponse>;
```

---

### 3. Status da Conexão (getConnectionState)

**Evolution API (Atual):**
```
GET /instance/connectionState/{instanceName}
Resposta: {instance: {instanceName, state: "open"|"close"}}
```

**Evolution Go (Novo):**
```
GET /instance/{instanceName}/status
Resposta: {instance: {state: "open"|"close"}}
```

**Status:** ✅ **Compatível** (resposta similar, URL padrão REST)  
**Impacto:** Mínimo (apenas URL mudança, estrutura preservada)

---

### 4. Enviar Texto (sendText)

**Evolution API (Atual):**
```
POST /message/sendText/{instanceName}
{
  number: "5511999999999",
  textMessage: { text: "Olá" },
  options: { presence: "composing", linkPreview: true }
}
```

**Evolution Go (Novo):**
```
POST /message/sendText/{instanceName}
{
  to: "5511999999999",
  text: "Olá",
  options?: { presence?: "composing", linkPreview?: true }
}
```

**Status:** ⚠️ **Incompatível** (payload estrutura diferente)  
**Impacto:** Médio (sendText é chamado em campanhas)

**Solução via Adapter:**
```typescript
// EvolutionApiProvider
async sendText(instanceName, toNumber, text) {
  return this.http.post(`${baseUrl}/message/sendText/${instanceName}`, {
    number: toNumber,
    textMessage: { text },
    options: { presence: "composing", linkPreview: true }
  });
}

// EvolutionGoProvider
async sendText(instanceName, toNumber, text) {
  return this.http.post(`${baseUrl}/message/sendText/${instanceName}`, {
    to: toNumber,
    text,
    options: { presence: "composing", linkPreview: true }
  });
}
```

---

### 5. Enviar Mídia (sendMedia)

**Evolution API (Atual):**
```
POST /message/sendMedia/{instanceName}
{
  number: "5511...",
  mediaMessage: {
    mediaType: "image"|"video"|"audio"|"document",
    fileName: "file.jpg",
    caption: "Descrição",
    media: "base64_or_url"
  },
  options: { presence: "composing" }
}
```

**Evolution Go (Novo):**
```
POST /message/sendMedia/{instanceName}
{
  to: "5511...",
  type: "image"|"video"|"audio"|"document",
  fileName: "file.jpg",
  caption?: "Descrição",
  media: "base64_or_url"
}
```

**Status:** ⚠️ **Incompatível** (payload completamente diferente)  
**Impacto:** Médio-Alto (sendMedia é usado em campanhas com mídia)

**Solução:** Adapter transforma estrutura antes de enviar

---

### 6. Webhooks

**Evolution API (Atual):**
```
Configurado em createInstance:
webhook: "https://meu-backend/webhooks/evolution"
webhook_by_events: true
events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", ...]

Payload recebido:
{
  instance: "user@123" ou instanceName,
  data: { qrcode, state, message, ... },
  event_type: "QRCODE_UPDATED",
  ...
}
```

**Evolution Go (Novo):**
```
Configurável via variável WEBHOOK_URL no .env
Payload diferente:
{
  instanceName: "user@123",
  event: "QRCODE_UPDATED",
  data: { qrcode, state, message, ... }
}
```

**Status:** ⚠️ **Parcialmente compatível** (mesmo propósito, formatos diferentes)  
**Impacto:** Médio (webhooks.controller.ts usa `pickInstanceName()` que já é flexível)

**Verificar:** O `webhooks.controller.ts` atual já trata múltiplos formatos:
```typescript
function pickInstanceName(payload: any): string | null {
  return (
    payload?.instance ??
    payload?.instanceName ??
    payload?.instance?.instanceName ??
    payload?.data?.instance ??
    payload?.data?.instanceName ??
    null
  );
}
```

**Status:** ✅ **Já é robusto** (flexível para múltiplas fontes)

---

### 7. Licença Obrigatória

**Evolution API:** Sem licença necessária  
**Evolution Go:** Requer ativação via Manager + heartbeat

**Novo fluxo:**
1. Evolution Go inicia em modo "unlicensed" (503 em /health)
2. Acessar `http://localhost:8080/manager/login`
3. Fazer login com API URL + API Key
4. Completar registro de licença
5. API ativa automaticamente
6. Heartbeats periódicos mantêm ativa

**Impacto:** 🔴 CRÍTICO para produção  
**Mitigação:** Automação de ativação na CI/CD ou init script

---

### 8. Banco de Dados

**Evolution API (Atual):**
```
1 PostgreSQL:
- evo_crm (app)
- evolution schema (Evolution API automaticamente cria)

DATABASE_URL=postgresql://evo:pass@postgres:5432/evo_crm?schema=public
DATABASE_CONNECTION_URI="postgresql://evo:pass@postgres:5432/evolution?schema=public"
```

**Evolution Go (Novo):**
```
2 PostgreSQL (ou 2 schemas/databases):
- POSTGRES_AUTH_DB=postgresql://.../(auth database)
- POSTGRES_USERS_DB=postgresql://.../(users database)

Ambos PostgreSQL nativamente (não usa schema isolation como Evolution API)
```

**Impacto:** 🟠 ALTO  
**Opções:**
- Opção A: Usar 2 containers PostgreSQL (mais isolado)
- Opção B: Usar 1 PostgreSQL + criar 2 databases
- Opção C: Usar 1 PostgreSQL + namespace/schema (requer config adicional em Evolution Go)

**Recomendação:** Opção B (1 PostgreSQL, 2 databases: `evo_crm`, `evolution_go`)

---

## ARQUITETURA PROPOSTA — Provider Adapter Pattern

### Interface Abstrata

```typescript
// src/whatsapp/whatsapp.provider.ts
export interface WhatsAppProvider {
  // Instance Management
  createInstance(params: CreateInstanceParams): Promise<CreateInstanceResponse>;
  deleteInstance(instanceName: string): Promise<any>;
  getQRCode(instanceName: string): Promise<QRCodeResponse>;
  getConnectionState(instanceName: string): Promise<ConnectionStateResponse>;
  restartInstance(instanceName: string): Promise<any>;
  logoutInstance(instanceName: string): Promise<any>;

  // Message Sending
  sendText(instanceName: string, toNumber: string, text: string): Promise<SendResponse>;
  sendMedia(params: SendMediaParams): Promise<SendResponse>;
}

export interface CreateInstanceParams {
  instanceName: string;
  number?: string;
  qrcode?: boolean;
  token?: string;
  webhook?: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrcode?: string;
  code?: string;
  raw: any;
}

export interface ConnectionStateResponse {
  instance?: {
    instanceName?: string;
    state?: "open" | "close" | "unknown";
  };
}

export interface SendMediaParams {
  instanceName: string;
  toNumber: string;
  mediaType: "image" | "video" | "audio" | "document";
  fileName: string;
  caption?: string;
  mediaBase64OrUrl: string;
}

export interface SendResponse {
  id?: string;
  status?: string;
  key?: string;
}
```

### Implementação: Evolution API Provider (Atual)

```typescript
// src/whatsapp/providers/evolution-api.provider.ts
@Injectable()
export class EvolutionApiProvider implements WhatsAppProvider {
  constructor(private http: HttpService, private config: ConfigService) {}

  async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResponse> {
    const body = {
      instanceName: params.instanceName,
      token: params.token ?? "",
      qrcode: params.qrcode ?? true,
      integration: "WHATSAPP-BAILEYS",
      ...(params.number && { number: params.number }),
      ...(params.webhook && {
        webhook: params.webhook,
        webhook_by_events: true,
        events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"]
      })
    };

    return this.http.post(`${this.baseUrl}/instance/create`, body, {
      headers: this.headers(),
      timeout: 60_000
    }).toPromise();
  }

  async getQRCode(instanceName: string): Promise<QRCodeResponse> {
    // GET /instance/connect/{instanceName}
    const res = await this.http.get(
      `${this.baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`,
      { headers: this.headers() }
    ).toPromise();
    return res.data;
  }

  async sendText(instanceName: string, toNumber: string, text: string): Promise<SendResponse> {
    const res = await this.http.post(
      `${this.baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`,
      {
        number: toNumber,
        textMessage: { text },
        options: { presence: "composing", linkPreview: true }
      },
      { headers: this.headers() }
    ).toPromise();
    return res.data;
  }

  async sendMedia(params: SendMediaParams): Promise<SendResponse> {
    const res = await this.http.post(
      `${this.baseUrl}/message/sendMedia/${encodeURIComponent(params.instanceName)}`,
      {
        number: params.toNumber,
        mediaMessage: {
          mediaType: params.mediaType,
          fileName: params.fileName,
          caption: params.caption ?? "",
          media: params.mediaBase64OrUrl
        },
        options: { presence: "composing" }
      },
      { headers: this.headers() }
    ).toPromise();
    return res.data;
  }

  // ... outros métodos (deleteInstance, getConnectionState, etc)
}
```

### Implementação: Evolution Go Provider (Novo)

```typescript
// src/whatsapp/providers/evolution-go.provider.ts
@Injectable()
export class EvolutionGoProvider implements WhatsAppProvider {
  constructor(private http: HttpService, private config: ConfigService) {}

  async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResponse> {
    const body = {
      instanceName: params.instanceName,
      token: params.token ?? "",
      qrcode: params.qrcode ?? true,
      integration: "WHATSAPP-BAILEYS",
      ...(params.number && { number: params.number }),
      ...(params.webhook && {
        webhook: params.webhook,
        webhook_by_events: true,
        events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"]
      })
    };

    // Evolution Go: mesma estrutura (compatível)
    return this.http.post(`${this.baseUrl}/instance/create`, body, {
      headers: this.authHeader(),
      timeout: 60_000
    }).toPromise();
  }

  async getQRCode(instanceName: string): Promise<QRCodeResponse> {
    // Evolution Go: GET /instance/{instanceName}/qrcode (diferente!)
    const res = await this.http.get(
      `${this.baseUrl}/instance/${encodeURIComponent(instanceName)}/qrcode`,
      { headers: this.authHeader() }
    ).toPromise();
    return res.data;
  }

  async sendText(instanceName: string, toNumber: string, text: string): Promise<SendResponse> {
    // Evolution Go: payload diferente {to, text} vs {number, textMessage}
    const res = await this.http.post(
      `${this.baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`,
      {
        to: toNumber,
        text,
        options: { presence: "composing", linkPreview: true }
      },
      { headers: this.authHeader() }
    ).toPromise();
    return res.data;
  }

  async sendMedia(params: SendMediaParams): Promise<SendResponse> {
    // Evolution Go: payload diferente {to, type, fileName, caption, media}
    const res = await this.http.post(
      `${this.baseUrl}/message/sendMedia/${encodeURIComponent(params.instanceName)}`,
      {
        to: params.toNumber,
        type: this.mapMediaType(params.mediaType),
        fileName: params.fileName,
        caption: params.caption ?? "",
        media: params.mediaBase64OrUrl
      },
      { headers: this.authHeader() }
    ).toPromise();
    return res.data;
  }

  private mapMediaType(type: string): string {
    // Evolution Go usa nomes diferentes?
    const map: Record<string, string> = {
      image: "image",
      video: "video",
      audio: "audio",
      document: "document"
    };
    return map[type] ?? type;
  }

  // ... outros métodos
}
```

### Factory/Selector

```typescript
// src/whatsapp/whatsapp.provider.factory.ts
export enum WhatsAppProviderType {
  EVOLUTION_API = "evolution-api",
  EVOLUTION_GO = "evolution-go"
}

@Injectable()
export class WhatsAppProviderFactory {
  constructor(
    private evolutionApi: EvolutionApiProvider,
    private evolutionGo: EvolutionGoProvider,
    private config: ConfigService
  ) {}

  getProvider(): WhatsAppProvider {
    const providerType = this.config.get<WhatsAppProviderType>(
      "WHATSAPP_PROVIDER",
      WhatsAppProviderType.EVOLUTION_API
    );

    if (providerType === WhatsAppProviderType.EVOLUTION_GO) {
      return this.evolutionGo;
    }
    return this.evolutionApi;
  }
}
```

### Usar no Serviço

```typescript
// src/instances/instances.service.ts (modificado)
@Injectable()
export class InstancesService {
  constructor(
    private prisma: PrismaService,
    private whatsappFactory: WhatsAppProviderFactory, // Antes: private evolution: EvolutionService
  ) {}

  async createForUser(userId: string, input: { instanceName: string; phoneNumber?: string }) {
    const whatsapp = this.whatsappFactory.getProvider(); // Abstração!

    try {
      await whatsapp.createInstance({
        instanceName: input.instanceName,
        number: input.phoneNumber,
        qrcode: true
      });
    } catch (e) {
      throw new BadRequestException("Falha ao criar instância");
    }
    // ... resto do código (sem mudanças!)
  }

  async getQRCode(user: JwtPayload, instanceId: string) {
    const whatsapp = this.whatsappFactory.getProvider();
    const raw = await whatsapp.getQRCode(instance.instanceName);
    // ... resto (sem mudanças!)
  }
}
```

### Variáveis .env

```bash
# Qual provider usar (evolution-api ou evolution-go)
WHATSAPP_PROVIDER=evolution-api

# Evolution API (atual)
EVOLUTION_API_URL_INTERNAL=http://evolution-api:8080
EVOLUTION_API_URL_PUBLIC=https://evolution-api.seudominio.com
EVOLUTION_API_KEY=change-me
EVOLUTION_WEBHOOK_SECRET=change-me-webhook-secret

# Evolution Go (novo, opcional)
EVOLUTION_GO_URL_INTERNAL=http://evolution-go:8080
EVOLUTION_GO_URL_PUBLIC=https://evolution-go.seudominio.com
EVOLUTION_GO_API_KEY=change-me
EVOLUTION_GO_WEBHOOK_SECRET=change-me-webhook-secret
EVOLUTION_GO_MANAGER_URL=http://evolution-go:8080/manager
```

---

## 7 FASES DE MIGRAÇÃO SEGURA

### **FASE 1: Análise Técnica** ✅ (VOCÊ ESTÁ AQUI)

**Objetivo:** Entender diferenças, riscos, compatibilidade  
**Entregáveis:**
- ✅ Tabela 1: Endpoints usados hoje
- ✅ Tabela 2: Comparação com Evolution Go
- ✅ Tabela 3: Riscos
- ✅ Arquitetura adapter pattern

**Próximo:** Plano de implementação do adapter

---

### **FASE 2: Implementar Adapter (Sem trocar provider)**

**Objetivo:** Preparar código para suportar 2 providers  
**Duração:** ~4-6 horas  
**Atividades:**
1. Criar interface `WhatsAppProvider` abstrata
2. Extrair `EvolutionService` → `EvolutionApiProvider`
3. Criar factory
4. Refatorar `InstancesService` e `CampaignExecutionService` para usar factory
5. Adicionar .env `WHATSAPP_PROVIDER=evolution-api` (padrão)
6. Testes: Confirmar que tudo funciona igual (deve funcionar!)

**Arquivos a criar:**
- `src/whatsapp/whatsapp.provider.ts` (interface)
- `src/whatsapp/providers/evolution-api.provider.ts` (refatorado de EvolutionService)
- `src/whatsapp/providers/evolution-go.provider.ts` (novo, vazio por enquanto)
- `src/whatsapp/whatsapp.provider.factory.ts` (factory)

**Arquivos a modificar:**
- `src/instances/instances.service.ts` (usar factory, não direct EvolutionService)
- `src/campaigns/campaign-execution.service.ts` (usar factory)
- `.env.example` (adicionar WHATSAPP_PROVIDER)
- `docker-compose.local.yml` (comentado Evolution Go, opcional)

**Critério de Aceite:**
- ✅ Build sem erros
- ✅ Testes passam (se houver)
- ✅ QR Code funciona (Evolution API)
- ✅ Envio de campanha funciona
- ✅ Webhooks funcionam
- ✅ Nenhuma mudança no comportamento externo

---

### **FASE 3: Implementar EvolutionGoProvider**

**Objetivo:** Código Evolution Go (ainda não usar)  
**Duração:** ~3-4 horas  
**Atividades:**
1. Implementar `EvolutionGoProvider` com todos os métodos
2. Traduzir payloads (sendText, sendMedia, getQRCode)
3. Mapeamento de tipos de mídia
4. Tratamento de erros/status codes diferentes
5. **NÃO ATIVAR AINDA** (WHATSAPP_PROVIDER=evolution-api)

**Critério de Aceite:**
- ✅ Código compila
- ✅ Todos os métodos implementados
- ✅ Comentários explicando payloads diferentes
- ✅ Evolution API ainda funciona 100%

---

### **FASE 4: Adicionar Evolution Go ao docker-compose.local**

**Objetivo:** Ambiente local com ambos os providers  
**Duração:** ~1-2 horas  
**Atividades:**
1. Adicionar serviço `evolution-go` ao `docker-compose.local.yml`
2. Configurar 2 PostgreSQL ou 2 schemas
3. Variáveis .env para Evolution Go (EVOLUTION_GO_URL_INTERNAL, etc)
4. Health check para Evolution Go
5. Desativar Evolution API não é necessário (ambos podem rodar)

**docker-compose.local.yml adicionar:**
```yaml
evolution-go:
  image: evoapicloud/evolution-go:latest
  environment:
    SERVER_PORT: 8081  # porta diferente da Evolution API (8080)
    CLIENT_NAME: evolution-go
    GLOBAL_API_KEY: ${EVOLUTION_GO_API_KEY}
    POSTGRES_AUTH_DB: postgresql://evo:pass@postgres:5432/evolution_go_auth?sslmode=disable
    POSTGRES_USERS_DB: postgresql://evo:pass@postgres:5432/evolution_go_users?sslmode=disable
    DATABASE_SAVE_MESSAGES: "false"
    WADEBUG: INFO
  ports:
    - "8081:8080"  # 8081 externamente, 8080 internamente
  healthcheck:
    test: ["CMD", "wget", "-q", "-O-", "http://localhost:8080/health"]
    interval: 15s
    timeout: 10s
    retries: 20
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - internal
    - public
```

**PostgreSQL criar databases:**
```sql
CREATE DATABASE evolution_go_auth;
CREATE DATABASE evolution_go_users;
```

**Critério de Aceite:**
- ✅ `docker compose -f docker-compose.local.yml up` sem erros
- ✅ Evolution Go sobe (health check passa)
- ✅ Manager acessível em `http://localhost:8081/manager`
- ✅ Evolution API continua em 8080
- ✅ Ambos rodando em paralelo

---

### **FASE 5: Testar QR Code com Evolution Go**

**Objetivo:** Validar que QR Code funciona (lado a lado)  
**Duração:** ~2-3 horas  
**Atividades:**
1. **Não mudar WHATSAPP_PROVIDER** (ainda evolution-api)
2. Criar 2ª instância (simulada) apontando para evolution-go
3. Testar GET QR Code direto da API Evolution Go (`/instance/{name}/qrcode`)
4. Comparar estrutura QR Code API vs Go
5. Ajustar `normalizeQr()` se necessário para suportar Go
6. Documentar qualquer diferença

**Teste manual:**
```bash
# Terminal 1: Criar instância em Evolution API
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: test-key" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"test-api","qrcode":true}'

# Terminal 2: Obter QR Code da API
curl http://localhost:8080/instance/connect/test-api \
  -H "apikey: test-key"

# Terminal 3: Criar instância em Evolution Go (depois de ativar)
curl -X POST http://localhost:8081/instance/create \
  -H "apikey: test-key-go" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"test-go","qrcode":true}'

# Terminal 4: Obter QR Code da Go (URL DIFERENTE!)
curl http://localhost:8081/instance/test-go/qrcode \
  -H "apikey: test-key-go"

# Comparar respostas JSON
```

**Critério de Aceite:**
- ✅ QR Code funciona em Evolution API
- ✅ QR Code funciona em Evolution Go (após ativação)
- ✅ Estruturas JSON mapeadas corretamente
- ✅ Adapter consegue normalizar ambas

---

### **FASE 6: Teste de Envio com 1 Contato (Evolution Go)**

**Objetivo:** Validar que mensagens funcionam em Go  
**Duração:** ~3-4 horas  
**Atividades:**
1. Mudar temporariamente `WHATSAPP_PROVIDER=evolution-go`
2. Ativar Evolution Go Manager (licença)
3. Criar 1 instância nova no Go
4. Conectar via QR Code
5. Criar 1 campanha com 1 contato opt-in
6. Disparar campanha em rascunho (teste)
7. Validar:
   - ✅ Mensagem enviada?
   - ✅ Status salvo no DB?
   - ✅ Webhooks recebidos?
   - ✅ MessageLog criado?
8. Voltar para Evolution API
9. Documentar qualquer diferença de comportamento

**Critério de Aceite:**
- ✅ Campanha envia via Evolution Go
- ✅ Mensagem chega no WhatsApp
- ✅ Banco de dados atualizado
- ✅ Webhooks funcionam

---

### **FASE 7: Decidir Provider Padrão (Se valer migrar)**

**Objetivo:** Recomendação final  
**Duração:** ~2 horas  
**Decisão baseada em:**

| Aspecto | Evolution API | Evolution Go | Vencedor |
|--------|---|---|---|
| Compatibilidade de endpoints | ✅ 100% | ⚠️ 80% (ajustes necessários) | API |
| Performance/Recursos | ⚠️ Node.js | ✅ Go (mais leve) | Go |
| Licença obrigatória | ✅ Não | ⚠️ Sim (gestão extra) | API |
| Documentação | ✅ Madura | ⚠️ Mais nova | API |
| Comunidade | ✅ Maior | ⚠️ Crescendo | API |
| PostgreSQL | ✅ 1 DB | ⚠️ 2 DB | API |
| Webhooks | ✅ Padrão | ⚠️ Customizável | API |
| **Recomendação** | **Manter** | **Opcional (futuro)** | - |

**Possíveis Escolhas:**

**Opção A: Manter Evolution API (Recomendado por agora)**
- Motivos: Menos riscos, menos complexidade, compatibilidade 100%
- Provider: WHATSAPP_PROVIDER=evolution-api
- Benefício: Zero mudança de código
- Recomendação: ✅ Manter assim

**Opção B: Migrar para Evolution Go**
- Motivos: Menor consumo de recursos, futuro-proof
- Provider: WHATSAPP_PROVIDER=evolution-go
- Risco: Ajustes de payload, licença, 2 DBs
- Recomendação: ❌ Esperar mais maturação

**Opção C: Suportar Ambos (Híbrido)**
- Motivos: Flexibilidade, testes A/B
- Provider: Selecionar via `WHATSAPP_PROVIDER`
- Benefício: Migration-ready sem pressa
- Recomendação: ✅ **MELHOR OPÇÃO** (você tem o adapter!)

---

## RESUMO DE MUDANÇAS DE CÓDIGO

### Arquivos a Criar:

```
src/whatsapp/
├── whatsapp.provider.ts                    (interface abstrata)
├── whatsapp.provider.factory.ts            (factory)
├── providers/
│   ├── evolution-api.provider.ts           (refatorado de EvolutionService)
│   └── evolution-go.provider.ts            (novo)
```

### Arquivos a Modificar:

```
src/
├── evolution/evolution.service.ts          (→ providers/evolution-api.provider.ts)
├── evolution/evolution.module.ts           (imports do novo adapter)
├── instances/instances.service.ts          (usar factory em vez de EvolutionService direto)
├── campaigns/campaign-execution.service.ts (usar factory)
├── config/env.ts                           (adicionar WHATSAPP_PROVIDER)
├── app.module.ts                           (registrar factory)
.env.example                                (adicionar variáveis Go opcionais)
docker-compose.local.yml                    (adicionar evolution-go comentado)
```

### Arquivo **NÃO** Será Tocado:

```
✅ docker-compose.prod.yml (continuará Evolution API por enquanto)
✅ webhooks.controller.ts   (já é robusto)
✅ instances.controller.ts  (usa service, não muda)
✅ frontend               (não muda nada)
```

---

## IMPACTO NO BUILD ATUAL

```
Fase 1 (Análise):      ✅ ZERO impacto (apenas documentação)
Fase 2 (Adapter):      ⚠️ BAIXO (refatoração interna, funcionalidade igual)
Fase 3 (EvolutionGo):  ✅ ZERO impacto (código novo, não usado)
Fase 4 (Docker local): ✅ ZERO impacto (compose local, prod sem mudança)
Fase 5-6 (Testes):     ✅ ZERO impacto em produção
Fase 7 (Decisão):      ⚠️ Se escolher Go, então sim, impacto (mas controlado)
```

---

## RECOMENDAÇÃO FINAL

### Curto Prazo (Agora - 2 semanas):

✅ **IMPLEMENTAR FASE 2 APENAS** (Adapter Pattern)

**Por quê?**
- Transforma código rígido em flexível
- Zera risco (Evolution API continua 100%)
- Prepara para migração futura **sem pressa**
- ~6-8 horas de trabalho
- Build continua funcionando normalmente

### Médio Prazo (2-8 semanas):

⚠️ **FASES 3-6 em ambiente staging/local**

**Por quê?**
- Testar Evolution Go sem impacto à produção
- Descobrir incompatibilidades em ambiente controlado
- Documentar ajustes necessários
- Validar licença + ativação

### Longo Prazo (Após validação):

❓ **FASE 7: Decidir com dados reais**

**Cenários:**
- Se Go passar 100%: Migrar gradualmente (A/B testing)
- Se houver incompatibilidades: Esperar Evolution Go amadurecer
- Se quiser flexibilidade: Manter híbrido (ambos disponíveis)

---

## CHECKLIST DE RISCO

```
ANTES DE IMPLEMENTAR ADAPTER (FASE 2):

[ ] Ler este documento inteiro
[ ] Entender pattern adapter
[ ] Validar que não quebra build atual
[ ] Fazer backup de código

ANTES DE TESTAR EVOLUTION GO (FASE 5):

[ ] Ter Evolution Go rodando localmente
[ ] Ter Manager acessível
[ ] Ter 2 PostgreSQL ou 2 schemas
[ ] Documentar versão do Evolution Go

ANTES DE MIGRAR PARA PRODUÇÃO (FASE 7+):

[ ] Todas as fases 1-6 completadas
[ ] Testes manual de QR Code
[ ] Testes de campanha
[ ] Testes de webhook
[ ] Testes de graceful fallback
[ ] Plano de rollback
```

---

## PRÓXIMOS PASSOS

1. **Você aprova migração para Fase 2?** (Adapter Pattern)
   - SIM → Vou criar EvolutionService → EvolutionApiProvider + Factory
   - NÃO → Mantemos Evolution API como está (seguro)

2. **Qual timeline?**
   - Imediato (próximas 2 semanas)?
   - Ou deixa para depois (depois de validação Fase 6)?

3. **Documentação**
   - Quer que eu crie MIGRATION_PLAN.md separado?
   - Quer que adicione testes unitários para adapter?

---

**Status:** 🔍 **ANÁLISE CONCLUÍDA**  
**Próximo:** Aguardando aprovação para FASE 2 (Adapter Implementation)  
**Data:** May 11, 2026

