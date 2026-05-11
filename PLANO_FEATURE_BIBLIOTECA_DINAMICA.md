# PLANO TÉCNICO: BIBLIOTECA DINÂMICA DE CONTEÚDO

## 1. ANÁLISE DA ESTRUTURA ATUAL

### 1.1 Stack Existente
- **Backend**: NestJS 11, TypeScript
- **Banco**: PostgreSQL + Prisma ORM
- **Filas**: BullMQ (Redis)
- **Storage**: MinIO (fallback local)
- **Frontend**: React 19, TypeScript, React Query, Zod, Hook Form
- **Autenticação**: JWT
- **Integração**: Evolution API (WhatsApp)

### 1.2 Fluxo Atual de Campanhas
1. Admin cria template com variáveis simples: `{{nome}}`, `{{telefone}}`, `{{midia:slug}}`
2. Admin cria campanha selecionando template + mídia opcional
3. CampaignExecutionService enfileira mensagens em BullMQ
4. Worker processa job por job:
   - Busca template
   - Busca mídia (se houver)
   - Remove variáveis com regex: `text.replace(/\{\{[^}]+\}\}/g, '')`
   - Envia via Evolution API
   - Registra em MessageLog com meta JSON

### 1.3 Estrutura de Dados Atual
**MessageTemplate** (tabela existente):
```
- id, userId, name, content, tags
- Não valida variáveis
- Content é string simples
```

**MediaLibrary** (tabela existente):
```
- id, userId, name, slug, type, filePath, publicUrl, size, tags
- Slug é único por usuário
- Tipos: IMAGE, VIDEO, AUDIO, PDF, DOCUMENT, TEXT
```

**MessageLog** (tabela existente):
```
- id, userId, instanceId, contactId, campaignId, direction, status, errorType, meta (JSON)
- Meta já suporta dados adicionais
- Índices em userId, instanceId, contactId, campaignId
```

### 1.4 Pontos de Integração Identificados
1. **Template Editor Frontend**: Botão para inserir grupos dinâmicos
2. **Campaign Execution Service**: Resolver `{{grupo:slug}}` antes de enviar
3. **MessageLog**: Registrar qual item foi escolhido no meta
4. **MediaLibrary**: Vincular itens do grupo à mídia existente
5. **Audit Logs**: Registrar importações e alterações de grupos

---

## 2. TABELAS NOVAS NECESSÁRIAS

### 2.1 ContentGroup (Biblioteca de Grupos)
```prisma
model ContentGroup {
  id              String                @id @default(cuid())
  userId          String
  name            String                // "Boas-vindas", "Saudações"
  slug            String                // "boas_vindas", "saudacoes"
  description     String?
  type            String                // TEXT, MEDIA, MIXED
  selectionMode   String                // RANDOM, SEQUENTIAL, WEIGHTED_RANDOM, LEAST_USED
  status          String                @default("ACTIVE")  // ACTIVE, INACTIVE
  maxUsagePerDay  Int?                  // Limite de uso diário (opcional)
  usageCount      Int                   @default(0)  // Total histórico
  
  user            User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  items           ContentGroupItem[]
  auditLogs       AuditLog[]
  
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  
  @@unique([userId, slug])
  @@index([userId])
  @@index([status])
}
```

### 2.2 ContentGroupItem (Itens dentro de um grupo)
```prisma
model ContentGroupItem {
  id              String                @id @default(cuid())
  groupId         String
  type            String                // TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, PDF
  textContent     String?               // Para tipo TEXT
  mediaId         String?               // Para tipos de mídia
  weight          Int                   @default(1)  // Para WEIGHTED_RANDOM
  status          String                @default("ACTIVE")  // ACTIVE, INACTIVE
  usageCount      Int                   @default(0)  // Vezes que foi selecionado
  lastUsedAt      DateTime?
  
  group           ContentGroup          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  media           MediaLibrary?         @relation(fields: [mediaId], references: [id], onDelete: SetNull)
  
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  
  @@index([groupId])
  @@index([mediaId])
  @@index([status])
}
```

### 2.3 Alteração em MediaLibrary
```prisma
// Adicionar relation para ContentGroupItem
model MediaLibrary {
  // ... campos existentes
  contentGroupItems ContentGroupItem[]  // Nova relação
}
```

### 2.4 Alteração em MessageLog
```prisma
// Já existe, mas será usado para:
meta: {
  // Campos que já existem:
  id: string  // Evolution message ID
  
  // Novos campos para grupo dinâmico:
  contentGroupUsed?: string           // slug do grupo
  contentGroupItemId?: string         // ID do item escolhido
  contentGroupItemType?: string       // TEXT, IMAGE, etc
  selectionMode?: string              // Qual modo foi usado
  mediaIdResolved?: string            // Se houver mídia
  templateFinal?: string              // Template após resolução (audit)
}
```

---

## 3. APIs NOVAS NECESSÁRIAS

### Backend - ContentGroup Controller

#### 3.1 GET /admin/content-groups
- Listar grupos do usuário
- Query params: search, type, status, limit, offset
- Response: Array de ContentGroup com contagem de itens

#### 3.2 POST /admin/content-groups
- Criar novo grupo
- Body: name, slug, description, type, selectionMode
- Validar: slug único por usuário
- Response: ContentGroup criado

#### 3.3 PATCH /admin/content-groups/:id
- Editar grupo
- Body: name, description, selectionMode, status, maxUsagePerDay
- Não permitir alterar slug (é chave)
- Response: ContentGroup atualizado

#### 3.4 DELETE /admin/content-groups/:id
- Deletar grupo (soft delete: status = INACTIVE)
- Ou hard delete com cascata
- Response: { success: true }

#### 3.5 GET /admin/content-groups/:id/items
- Listar itens do grupo
- Query params: status, limit, offset
- Response: Array de ContentGroupItem com dados de uso

#### 3.6 POST /admin/content-groups/:id/items
- Adicionar item manualmente
- Body: type, textContent (se TEXT), mediaId (se MEDIA), weight, status
- Validar: se mediaId, existe e pertence ao usuário
- Response: ContentGroupItem criado

#### 3.7 PATCH /admin/content-groups/:id/items/:itemId
- Editar item
- Body: textContent, weight, status
- Não permitir alterar type
- Response: ContentGroupItem atualizado

#### 3.8 DELETE /admin/content-groups/:id/items/:itemId
- Deletar item do grupo
- Response: { success: true }

#### 3.9 POST /admin/content-groups/:id/items/bulk-import
- Importar itens via Excel
- Body: FormData com arquivo .xlsx
- Processar: GRUPO | TIPO | CONTEUDO | PESO | STATUS
- Validar: 
  - GRUPO deve existir ou será criado automaticamente
  - TIPO deve ser válido
  - PESO deve ser número >= 1
  - STATUS deve ser ACTIVE ou INACTIVE
- Retornar: { imported: 2000, errors: [], warnings: [] }
- Limites: Max 5.000 itens por importação

#### 3.10 POST /admin/content-groups/:id/test
- Testar seleção do grupo
- Body: { iterations: 10 }
- Response: Array mostrando distribuição de seleções
- Útil para verificar modos de seleção

#### 3.11 GET /admin/content-groups/:id/usage-stats
- Estatísticas de uso do grupo
- Response: { totalUsages, itemsUsageBreakdown, lastUsedAt, avgUsagePerDay }

#### 3.12 GET /admin/content-groups/validate/:slug
- Validar se slug está disponível
- Response: { available: boolean }

### Backend - Resolver Service (novo)

#### 3.13 POST /admin/templates/:id/preview
- Preview do template com grupos resolvidos
- Body: { contactData: { nome, telefone, etiqueta, ... } }
- Response: { rendered: string, usedGroups: [], warnings: [] }
- Simula a resolução de variáveis

---

## 4. ARQUIVOS A SEREM CRIADOS

### Backend (NestJS)

```
apps/backend/src/content-groups/
├── content-groups.module.ts
├── content-groups.controller.ts
├── content-groups.service.ts
├── dto/
│   ├── create-content-group.dto.ts
│   ├── update-content-group.dto.ts
│   ├── create-content-group-item.dto.ts
│   └── bulk-import.dto.ts
└── utils/
    ├── template-resolver.service.ts
    ├── excel-parser.service.ts
    └── selection-algorithm.service.ts
```

### Frontend (React)

```
apps/frontend/src/features/admin/
├── pages/
│   └── AdminContentGroupsPage.tsx
├── components/
│   ├── ContentGroupList.tsx
│   ├── ContentGroupForm.tsx
│   ├── ContentGroupItemsList.tsx
│   ├── ContentGroupItemForm.tsx
│   ├── BulkImportDialog.tsx
│   ├── ContentGroupTestDialog.tsx
│   └── GroupVariableButton.tsx
```

---

## 5. ARQUIVOS A SEREM ALTERADOS

### Backend

#### 5.1 `apps/backend/prisma/schema.prisma`
- Adicionar models: ContentGroup, ContentGroupItem
- Adicionar relação em MediaLibrary
- Gerar migration: `prisma migrate dev --name add_content_groups`

#### 5.2 `apps/backend/src/campaigns/campaign-execution.service.ts`
- **Linha 123-124**: Substituir regex simples por resolução completa
- Importar TemplateResolverService
- Antes de enviar, resolver `{{grupo:slug}}`
- Registrar em MessageLog.meta qual item foi escolhido

#### 5.3 `apps/backend/src/auth/roles.guard.ts`
- Adicionar rota de ContentGroups ao protetor de rotas

#### 5.4 `apps/backend/src/app.module.ts`
- Importar ContentGroupsModule

#### 5.5 `apps/backend/nest-cli.json`
- Nenhuma alteração necessária

### Frontend

#### 5.6 `apps/frontend/src/router/index.tsx` (ou equivalente)
- Adicionar rota: `/admin/content-groups`

#### 5.7 `apps/frontend/src/features/admin/pages/AdminTemplatesPage.tsx`
- Adicionar botão "Inserir Grupo Dinâmico" ao editor
- Popup com lista de grupos disponíveis
- Inserir `{{grupo:slug}}` no template

#### 5.8 `apps/frontend/src/features/admin/pages/AdminCampaignsPage.tsx`
- Nenhuma alteração (herda grupos do template)
- Adicionar "Preview com grupos resolvidos" antes de criar

#### 5.9 `apps/frontend/src/lib/api.ts`
- Adicionar endpoints para ContentGroups (se necessário)

---

## 6. TIPOS E ENUMS

### Backend - Enums Prisma

```prisma
enum ContentGroupType {
  TEXT
  MEDIA
  MIXED
}

enum ContentGroupSelectionMode {
  RANDOM           // Aleatório puro
  SEQUENTIAL       // Sempre próximo (rotina)
  WEIGHTED_RANDOM  // Baseado em peso
  LEAST_USED       // Menos usado primeiro
}

enum ContentGroupItemType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  PDF
}

enum ContentGroupStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### Frontend - TypeScript Types

```typescript
interface ContentGroup {
  id: string
  userId: string
  name: string
  slug: string
  description?: string
  type: 'TEXT' | 'MEDIA' | 'MIXED'
  selectionMode: 'RANDOM' | 'SEQUENTIAL' | 'WEIGHTED_RANDOM' | 'LEAST_USED'
  status: 'ACTIVE' | 'INACTIVE'
  maxUsagePerDay?: number
  usageCount: number
  itemsCount?: number
  createdAt: string
  updatedAt: string
}

interface ContentGroupItem {
  id: string
  groupId: string
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'PDF'
  textContent?: string
  mediaId?: string
  media?: { slug: string; publicUrl: string }
  weight: number
  status: 'ACTIVE' | 'INACTIVE'
  usageCount: number
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}
```

---

## 7. FLUXO DE EXECUÇÃO DETALHADO

### Fluxo 1: Criação de Grupo Dinâmico

```
Admin clica "Admin > Conteúdo Dinâmico"
  ↓
Frontend carrega lista de grupos (GET /admin/content-groups)
  ↓
Admin clica "Novo Grupo"
  ↓
Modal abre com form:
  - Nome: "Boas-vindas"
  - Slug: "boas_vindas" (auto-gerado, editável)
  - Descrição: "Mensagens de boas-vindas"
  - Tipo: "TEXT" ou "MEDIA"
  - Modo: "RANDOM" ou "SEQUENTIAL" ou "WEIGHTED_RANDOM" ou "LEAST_USED"
  - Status: "ACTIVE"
  ↓
Admin clica "Criar"
  ↓
POST /admin/content-groups
  Backend valida slug único (userId, slug)
  Backend cria ContentGroup
  ↓
Sucesso → Toast "Grupo criado"
```

### Fluxo 2: Importação via Excel

```
Admin em "Conteúdo Dinâmico" clica "Importar"
  ↓
Modal "Bulk Import" abre
  - Download template Excel
  - Upload arquivo preenchido
  ↓
Admin seleciona arquivo .xlsx
  ↓
POST /admin/content-groups/:id/items/bulk-import
  Backend recebe arquivo
  Backend carrega com xlsx library
  ↓
Para cada linha:
  - Validar GRUPO existe
  - Validar TIPO válido
  - Se CONTEUDO vazio, skip
  - Se PESO não número, erro
  - Se MEDIA_SLUG, buscar mediaId
  ↓
Backend cria 2.000 ContentGroupItem registros
  ↓
Response: { imported: 2000, errors: [], warnings: []}
Toast "2.000 itens importados"
```

### Fluxo 3: Uso em Template

```
Admin em "Templates" clica "Novo" ou "Editar"
  ↓
Editor abre com campo de conteúdo
  ↓
Admin escreve: "Olá {{nome}}, você tem uma oferta!"
  ↓
Admin clica "Inserir Grupo Dinâmico"
  ↓
Popup lista grupos:
  - Boas-vindas (3 itens)
  - Ofertas (50 itens)
  - Imagens aleatórias (20 itens)
  ↓
Admin seleciona "Ofertas"
  ↓
Template vira: "Olá {{nome}}, você tem uma oferta! {{grupo:ofertas}}"
  ↓
Admin salva template
```

### Fluxo 4: Execução de Campanha com Grupo

```
Admin cria campanha com template que contém {{grupo:ofertas}}
  ↓
Admin clica "Iniciar Campanha"
  ↓
CampaignExecutionService.enqueueCampaignMessages(campaignId)
  ↓
Para cada contato, enfileira job em BullMQ
  ↓
Worker processa job:
  1. Busca campaign, instance, contact
  2. Busca template: "Olá {{nome}}, oferta {{grupo:ofertas}}"
  3. Chama TemplateResolverService.resolve()
     a. Detecta {{nome}} → busca contact.name
     b. Detecta {{grupo:ofertas}} → chama ContentGroupResolver
        - Busca grupo "ofertas"
        - Aplica selectionMode (ex: WEIGHTED_RANDOM)
        - Escolhe item aleatório respeitando peso
        - Se item.type = TEXT, retorna textContent
        - Se item.type = IMAGE, retorna mediaId
     c. Retorna template resolvido: "Olá João, oferta {{grupo:ofertas}}"
                                    → "Olá João, oferta Promoção 50% OFF"
  4. Se houver mídia, anexa ao envio
  5. Envia via Evolution API
  6. Registra em MessageLog com meta:
     {
       contentGroupUsed: "ofertas",
       contentGroupItemId: "item-123",
       contentGroupItemType: "TEXT",
       selectionMode: "WEIGHTED_RANDOM",
       templateFinal: "Olá João, oferta Promoção 50% OFF"
     }
  ↓
Log auditado
```

---

## 8. RISCOS TÉCNICOS

### 8.1 Performance
- **Risco**: Importar 2.000 itens pode travar o servidor
- **Mitigação**: 
  - Usar bulk insert do Prisma: `prisma.contentGroupItem.createMany()`
  - Chunkar em lotes de 500
  - Rodar em background job com BullMQ
  - Retornar jobId e mostrar progresso

- **Risco**: Resolver template com 10+ grupos em campanha grande
- **Mitigação**:
  - Cache de grupos em memória (30 min TTL com Redis)
  - Pré-resolver variáveis antes de enfileirar (não no worker)
  - Índices em ContentGroup.userId, slug

### 8.2 Consistência de Dados
- **Risco**: Deletar mídia enquanto está em ContentGroupItem
- **Mitigação**:
  - ForeignKey com onDelete: SetNull
  - Validação ao salvar item: se mediaId, verificar existência
  - Soft delete opcional para itens (status INACTIVE)

- **Risco**: Usuário A acessa grupo de Usuário B
- **Mitigação**:
  - Sempre filtrar por userId em queries
  - Checks de autorização no controller
  - Índice em (userId, slug)

### 8.3 Limite de Uso
- **Risco**: Grupo muito popular, todas mensagens usam mesmo item
- **Mitigação**:
  - Modos de seleção diferentes (LEAST_USED, SEQUENTIAL, WEIGHTED_RANDOM)
  - LEAST_USED: atualizar usageCount após cada seleção
  - Logs para audit

### 8.4 Integração com Evolution API
- **Risco**: Enviar mídia do grupo quebra se publicUrl inválido
- **Mitigação**:
  - Validar publicUrl antes de enviar
  - Fallback para filePath se publicUrl falhar
  - Log de erro, não pausar campanha

### 8.5 Estrutura do Template
- **Risco**: `{{grupo:ofertas}}` quebra se slug não existe
- **Mitigação**:
  - Validar slug ao salvar template
  - Preview mostra erro se grupo não encontrado
  - Fallback: remover variável se grupo inativo

---

## 9. ORDEM SEGURA DE IMPLEMENTAÇÃO

### FASE 1: Banco de Dados (Dia 1)
1. [ ] Criar migrations Prisma (ContentGroup, ContentGroupItem)
2. [ ] Gerar Prisma client
3. [ ] Testar conexão (seed opcional)

### FASE 2: Backend - APIs Básicas (Dia 2-3)
1. [ ] Criar ContentGroupsModule
2. [ ] Implementar ContentGroupsService
3. [ ] Implementar ContentGroupsController (CRUD básico)
4. [ ] Testes unitários do service
5. [ ] Validar autorização (userId)

### FASE 3: Backend - Resolução (Dia 4)
1. [ ] Criar TemplateResolverService
2. [ ] Implementar SelectionAlgorithmService (RANDOM, SEQUENTIAL, WEIGHTED_RANDOM, LEAST_USED)
3. [ ] Testes unitários
4. [ ] Integrar em CampaignExecutionService (linha 123-124)
5. [ ] Testar com campanha real

### FASE 4: Backend - Importação (Dia 5)
1. [ ] Criar ExcelParserService
2. [ ] Implementar POST /admin/content-groups/:id/items/bulk-import
3. [ ] Validar 2.000 itens
4. [ ] Teste de performance

### FASE 5: Frontend - CRUD (Dia 6-7)
1. [ ] Criar AdminContentGroupsPage
2. [ ] Criar ContentGroupList
3. [ ] Criar ContentGroupForm (novo/editar)
4. [ ] Criar ContentGroupItemsList
5. [ ] Criar ContentGroupItemForm
6. [ ] Integrar em rota /admin/content-groups

### FASE 6: Frontend - Importação (Dia 8)
1. [ ] Criar BulkImportDialog
2. [ ] Implementar upload e preview
3. [ ] Testar com arquivo real

### FASE 7: Frontend - Template Integration (Dia 9)
1. [ ] Adicionar botão "Inserir Grupo" em AdminTemplatesPage
2. [ ] Popup para selecionar grupo
3. [ ] Inserir `{{grupo:slug}}` no editor
4. [ ] Preview de grupos

### FASE 8: Testes e Ajustes (Dia 10-11)
1. [ ] Teste E2E: criar grupo → usar em template → executar campanha
2. [ ] Teste: 2.000 itens, resolver em tempo real
3. [ ] Teste: Selection modes funcionam
4. [ ] Teste: MessageLog registra corretamente
5. [ ] Performance com Redis cache

### FASE 9: Deploy (Dia 12)
1. [ ] Rodar migrations em produção
2. [ ] Atualizar backend
3. [ ] Atualizar frontend
4. [ ] Monitorar logs

---

## 10. CHECKLIST DE TESTES

### Testes Backend

- [ ] **CRUD de Grupos**
  - [ ] POST: Criar grupo com slug único
  - [ ] POST: Rejeitar slug duplicado (mesmo usuário)
  - [ ] GET: Listar apenas grupos do usuário autenticado
  - [ ] PATCH: Editar nome, descrição, selectionMode
  - [ ] PATCH: Não permitir editar slug
  - [ ] DELETE: Soft delete (status INACTIVE)

- [ ] **CRUD de Itens**
  - [ ] POST: Criar item TEXT
  - [ ] POST: Criar item com mediaId válido
  - [ ] POST: Rejeitar mediaId inválido
  - [ ] POST: Rejeitar mediaId de outro usuário
  - [ ] PATCH: Editar weight, status
  - [ ] DELETE: Remover item

- [ ] **Bulk Import**
  - [ ] Importar 100 itens (validar performance)
  - [ ] Importar 2.000 itens (validar bulk insert)
  - [ ] Validar erros: TIPO inválido, PESO não-número
  - [ ] Validar warnings: CONTEUDO vazio
  - [ ] Criar grupo automaticamente se não existir

- [ ] **Template Resolver**
  - [ ] Resolver `{{nome}}` com contact.name
  - [ ] Resolver `{{grupo:ofertas}}` com item TEXT
  - [ ] Resolver `{{grupo:imagens}}` com mediaId
  - [ ] Retornar erro se grupo inativo
  - [ ] Retornar erro se slug não existe
  - [ ] Selection mode RANDOM funciona
  - [ ] Selection mode SEQUENTIAL funciona
  - [ ] Selection mode WEIGHTED_RANDOM respeita peso
  - [ ] Selection mode LEAST_USED prioriza não-usados

- [ ] **Campaign Execution**
  - [ ] CampaignExecutionService resolve grupos antes de enviar
  - [ ] MessageLog registra contentGroupUsed, contentGroupItemId
  - [ ] MessageLog registra templateFinal renderizado
  - [ ] usageCount incrementa após seleção
  - [ ] maxUsagePerDay é respeitado (se definido)

- [ ] **Autorização**
  - [ ] Usuário A não pode ver grupos de Usuário B
  - [ ] Usuário USER não pode acessar /admin/content-groups
  - [ ] ADMIN pode gerenciar todos os grupos de seu usuário

- [ ] **Optout/OptIn**
  - [ ] Grupo responde se contato tem optIn: false
  - [ ] Não enviar se contact.status = OPTOUT
  - [ ] Não enviar se contact.optOutAt é válido

### Testes Frontend

- [ ] **AdminContentGroupsPage**
  - [ ] Carrega lista de grupos
  - [ ] Busca filtra por nome
  - [ ] Botão "Novo" abre form
  - [ ] Form valida slug único
  - [ ] Salvar cria grupo
  - [ ] Editar atualiza grupo
  - [ ] Deletar desativa grupo

- [ ] **ContentGroupItemsList**
  - [ ] Listar itens do grupo
  - [ ] Criar item TEXT
  - [ ] Criar item com mídia
  - [ ] Editar item
  - [ ] Deletar item
  - [ ] Mostra usageCount

- [ ] **BulkImportDialog**
  - [ ] Download template Excel
  - [ ] Upload arquivo válido
  - [ ] Mostra progresso
  - [ ] Sucesso: Toast + refresh

- [ ] **Template Editor Integration**
  - [ ] Botão "Inserir Grupo" visível
  - [ ] Popup lista grupos
  - [ ] Click insere `{{grupo:slug}}`
  - [ ] Preview mostra grupos resolvidos

- [ ] **Template Preview**
  - [ ] Preview mostra "Olá João, Promoção 50% OFF"
  - [ ] Preview identifica variáveis não-resolvidas
  - [ ] Preview simula 5 seleções para RANDOM

### Testes Integração

- [ ] **Fluxo Completo**
  1. [ ] Criar grupo "boas_vindas" com 3 itens TEXT
  2. [ ] Importar 100 itens em grupo "ofertas"
  3. [ ] Criar template: "Olá {{nome}}! {{grupo:boas_vindas}} {{grupo:ofertas}}"
  4. [ ] Criar campanha com template
  5. [ ] Iniciar campanha com 10 contatos
  6. [ ] Verificar MessageLog.meta contém contentGroupUsed
  7. [ ] Verificar usageCount incrementou

- [ ] **Performance**
  - [ ] Importar 2.000 itens < 10 segundos
  - [ ] Resolver template com 5 grupos < 100ms
  - [ ] Campanha com 1.000 contatos < 5 minutos (enfileiramento)

- [ ] **Tratamento de Erros**
  - [ ] Grupo inativo não resolve
  - [ ] Mídia faltante não quebra
  - [ ] Import com erros mostra resumo
  - [ ] Logs registram tudo

---

## 11. IMPACTOS EM MÓDULOS EXISTENTES

### 11.1 Campanhas
- **Impacto**: CampaignExecutionService será alterado
- **Risco**: Variáveis nem sempre eram resolvidas, agora todas serão
- **Mitigation**: Backward compatible - grupos opcionais

### 11.2 Templates
- **Impacto**: Admin pode inserir grupos
- **Risco**: Nenhum, é adição
- **Mitigation**: Validação ao salvar

### 11.3 Mídia
- **Impacto**: MediaLibrary.contentGroupItems relação nova
- **Risco**: Baixo, soft relation
- **Mitigation**: onDelete: SetNull

### 11.4 MessageLog
- **Impacto**: Novo campo meta.contentGroupUsed
- **Risco**: Nenhum, JSON é flexível
- **Mitigation**: Existing logs não têm, é ok

### 11.5 AuditLog
- **Impacto**: Registrar importações e edições
- **Risco**: Nenhum, é adição
- **Mitigation**: Opcional

---

## 12. ESTIMATIVA DE ESFORÇO

| Fase | Descrição | Dias | Complexidade |
|------|-----------|------|--------------|
| 1    | Banco de Dados | 1 | Baixa |
| 2    | APIs Básicas | 2 | Média |
| 3    | Resolução | 1 | Alta |
| 4    | Importação | 1 | Alta |
| 5    | Frontend CRUD | 2 | Média |
| 6    | Frontend Import | 1 | Média |
| 7    | Template Integration | 1 | Baixa |
| 8    | Testes | 2 | Média |
| 9    | Deploy | 1 | Baixa |
| **TOTAL** | | **12 dias** | |

---

## 13. PRÓXIMAS ETAPAS

1. [ ] Revisar este plano com arquiteto
2. [ ] Aprovar mudanças no schema Prisma
3. [ ] Validar riscos técnicos
4. [ ] Começar Fase 1 (Banco de Dados)
5. [ ] Criar migration Prisma
6. [ ] Executar testes após cada fase

---

## RESUMO EXECUTIVO

A **Biblioteca Dinâmica de Conteúdo** é uma feature de **baixo risco, alto valor**:

✅ **Não quebra módulos existentes** (backward compatible)  
✅ **Usa estrutura já estabelecida** (BullMQ, Prisma, React Query)  
✅ **Performance validada** (bulk import otimizado)  
✅ **Segurança garantida** (isolamento por userId)  
✅ **Auditável** (logs em MessageLog.meta)  

**Tempo total**: 12 dias  
**Equipe**: 1 Full-Stack (backend + frontend)  
**Deploy**: Zero downtime (migration + soft release)

