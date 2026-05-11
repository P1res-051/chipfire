# Teste do Módulo Campanhas

## Pré-requisitos

1. Backend rodando (`docker-compose up`)
2. PostgreSQL conectado e Prisma migrado
3. Redis disponível para BullMQ
4. Evolution API acessível
5. Pelo menos 1 usuário admin criado
6. Pelo menos 1 template criado
7. Pelo menos 1 instância WhatsApp conectada
8. Pelo menos 1 contato com etiqueta criado

## Teste 1: Listar Campanhas (GET /api/campaigns)

**Objetivo:** Verificar se o endpoint lista campanhas corretamente.

**Passos:**
1. Fazer request: `GET /api/campaigns`
2. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
```json
{
  "items": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

## Teste 2: Criar Campanha (POST /api/campaigns)

**Objetivo:** Criar uma nova campanha com validação completa.

**Passos:**
1. Fazer request: `POST /api/campaigns`
2. Headers: `Authorization: Bearer <token_admin>`
3. Body:
```json
{
  "name": "Campanha Teste",
  "description": "Campanha de teste para validação",
  "contactTag": "clientes",
  "templateId": "<template_id>",
  "instanceIds": ["<instance_id>"],
  "allowedStartTime": "08:00",
  "allowedEndTime": "20:00",
  "dailyLimitPerInstance": 100,
  "intervalMinSeconds": 15,
  "intervalMaxSeconds": 60,
  "maxErrorRatePercent": 5,
  "maxOptOutRatePercent": 2
}
```

**Esperado:**
- Status 201
- Campanha criada com status "DRAFT"
- Contatos com tag "clientes" associados
- Instâncias associadas
- ContactCount > 0

**Casos de Erro:**
- Sem template: "Template inválido ou não pertence a você"
- Template de outro usuário: erro
- Sem instâncias: "Selecione pelo menos uma instância"
- Instância de outro usuário: erro
- Sem contatos com tag: "Nenhum contato com opt-in confirmado encontrado"

## Teste 3: Obter Detalhes da Campanha (GET /api/campaigns/:id)

**Objetivo:** Buscar detalhes completos de uma campanha.

**Passos:**
1. Criar uma campanha (Teste 2)
2. Fazer request: `GET /api/campaigns/<campaign_id>`
3. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- Dados completos da campanha
- Relacionamentos inclusos (template, contatos, instâncias)
- MessageLogs vazios ou com histórico

## Teste 4: Atualizar Campanha (PATCH /api/campaigns/:id)

**Objetivo:** Editar uma campanha em estado DRAFT.

**Passos:**
1. Criar uma campanha (Teste 2)
2. Fazer request: `PATCH /api/campaigns/<campaign_id>`
3. Headers: `Authorization: Bearer <token_admin>`
4. Body:
```json
{
  "name": "Campanha Teste Atualizada",
  "description": "Nova descrição",
  "allowedStartTime": "09:00",
  "dailyLimitPerInstance": 150
}
```

**Esperado:**
- Status 200
- Nome e descrição atualizados
- Horários atualizados

**Casos de Erro:**
- Campanha em estado ACTIVE: "Só é possível editar campanhas em estado DRAFT"
- ID inválido: 404

## Teste 5: Iniciar Campanha (POST /api/campaigns/:id/start)

**Objetivo:** Transicionar campanha de DRAFT para ACTIVE e enfileirar mensagens.

**Passos:**
1. Criar uma campanha (Teste 2)
2. Fazer request: `POST /api/campaigns/<campaign_id>/start`
3. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- Status alterado para "ACTIVE"
- Mensagens enfileiradas no Redis (verificar com `redis-cli`)
- Nenhum erro de enfileiramento

**Verificação Redis:**
```bash
redis-cli
KEYS campaign-execution-queue:* | wc -l
```

Deve haver jobs na fila.

**Casos de Erro:**
- Campanha em estado ACTIVE: "Só campanhas em DRAFT podem ser iniciadas"

## Teste 6: Pausar Campanha (POST /api/campanhas/:id/pause)

**Objetivo:** Pausar uma campanha ativa.

**Passos:**
1. Iniciar campanha (Teste 5)
2. Fazer request: `POST /api/campaigns/<campaign_id>/pause`
3. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- Status alterado para "PAUSED"
- Mensagens continuam na fila (não são canceladas)

**Casos de Erro:**
- Campanha em estado DRAFT: "Só campanhas em ACTIVE podem ser pausadas"

## Teste 7: Parar/Finalizar Campanha (POST /api/campaigns/:id/stop)

**Objetivo:** Finalizar uma campanha e cancelar mensagens enfileiradas.

**Passos:**
1. Iniciar campanha (Teste 5)
2. Fazer request: `POST /api/campaigns/<campaign_id>/stop`
3. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- Status alterado para "FINISHED"
- Mensagens removidas da fila
- Redis não contém mais jobs da campanha

**Verificação:**
```bash
redis-cli
KEYS campaign-execution-*:<campaign_id>*
```

Deve estar vazio.

## Teste 8: Obter Métricas (GET /api/campaigns/:id/metrics)

**Objetivo:** Buscar métricas detalhadas da campanha.

**Passos:**
1. Criar e iniciar campanha (Testes 2 + 5)
2. Aguardar alguns segundos para processamento
3. Fazer request: `GET /api/campaigns/<campaign_id>/metrics`
4. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- totalContacts > 0
- sent >= 0
- failed >= 0
- pending <= totalContacts
- errorRate >= 0
- logs array com histórico de mensagens

## Teste 9: Deletar Campanha (DELETE /api/campaigns/:id)

**Objetivo:** Deletar uma campanha em estado DRAFT.

**Passos:**
1. Criar uma campanha (Teste 2)
2. Fazer request: `DELETE /api/campaigns/<campaign_id>`
3. Headers: `Authorization: Bearer <token_admin>`

**Esperado:**
- Status 200
- Campanha removida do banco

**Casos de Erro:**
- Campanha em estado ACTIVE: "Só é possível deletar campanhas em estado DRAFT"

## Teste 10: Validação de Permissão (Não-admin)

**Objetivo:** Verificar controle de acesso para usuários não-admin.

**Passos:**
1. Fazer request com token de usuário regular (não-admin)
2. Qualquer endpoint de campanhas

**Esperado:**
- Status 403
- Mensagem: "Forbidden" ou similar
- Acesso negado para não-admins

## Teste 11: Processamento de Mensagens (BullMQ)

**Objetivo:** Verificar se mensagens são processadas corretamente da fila.

**Setup:**
1. Garantir Evolution API está disponível
2. Campainha iniciada (Teste 5)

**Passos:**
1. Monitorar logs do processador:
```bash
docker-compose logs -f backend | grep "CampaignSender"
```

2. Verificar se mensagens são processadas:
- "Processando mensagem para..."
- "Mensagem processada com sucesso" ou "Erro ao enviar mensagem"

**Esperado:**
- Mensagens sendo processadas sequencialmente
- Logs de sucesso/erro para cada contato
- MessageLogs criados no banco de dados

## Teste 12: Taxa de Erro e Auto-pause

**Objetivo:** Verificar se a campanha é pausada quando taxa de erro excede limite.

**Setup:**
1. Desligar Evolution API ou mockar respostas de erro
2. Campanha com maxErrorRatePercent = 10%

**Passos:**
1. Iniciar campanha
2. Aguardar processamento de mensagens
3. Verificar se campanha é pausada automaticamente

**Esperado:**
- Campanha muda de ACTIVE para PAUSED
- Logs contêm erros
- Taxa de erro > maxErrorRatePercent

## Teste 13: Respeito ao Horário Permitido

**Objetivo:** Verificar se mensagens respeitam allowedStartTime/EndTime.

**Setup:**
1. Criar campanha com:
   - allowedStartTime: "14:00"
   - allowedEndTime: "16:00"
2. Iniciar em horário fora do intervalo (ex: 10:00)

**Passos:**
1. Iniciar campanha fora do intervalo
2. Verificar logs de enfileiramento

**Esperado:**
- Mensagens agendadas para próximo intervalo permitido
- Não são enviadas imediatamente
- BullMQ mostra delay correto

## Teste 14: Limite Diário

**Objetivo:** Verificar se limite diário por instância é respeitado.

**Setup:**
1. Campanha com dailyLimitPerInstance = 2
2. 10 contatos

**Passos:**
1. Iniciar campanha
2. Monitorar processamento

**Esperado:**
- Máximo 2 mensagens enviadas no dia
- Restantes agendadas para dia seguinte
- Logs mostram "DAILY_LIMIT_REACHED"

## Teste 15: Frontend - Listar Campanhas

**Objetivo:** Verificar página de campanhas no frontend.

**Passos:**
1. Navegar para /admin/campanhas
2. Verificar se lista carrega

**Esperado:**
- Página carrega sem erros
- Lista vazia inicialmente
- Botão "Nova Campanha" visível

## Teste 16: Frontend - Criar Campanha

**Objetivo:** Testar form de criação de campanha.

**Passos:**
1. Clicar em "Nova Campanha"
2. Preencher formulário:
   - Nome: "Teste Frontend"
   - Template: selecionar
   - Etiqueta: selecionar
   - Instâncias: selecionar
   - Manter padrões dos limites
3. Clicar em "Criar Campanha"

**Esperado:**
- Dialog fecha
- Toast de sucesso
- Lista atualiza com nova campanha
- Status = "Rascunho"

## Teste 17: Frontend - Detalhe e Ações

**Objetivo:** Testar detalhes e botões de ação.

**Passos:**
1. Selecionar campanha da lista
2. Verificar detalhes exibidos
3. Clicar em "Iniciar"
4. Verificar transição de status

**Esperado:**
- Detalhes carregam (cards com métricas)
- Botão "Iniciar" aparece para DRAFT
- Status muda para "Ativa"
- Botões mudam para "Pausar" e "Finalizar"

## Teste 18: Frontend - Métricas

**Objetivo:** Testar exibição de métricas detalhadas.

**Passos:**
1. Campanha em estado ACTIVE
2. Aguardar alguns segundos
3. Clicar em "Ver Métricas Detalhadas"

**Esperado:**
- Card de métricas carrega
- Barras de progresso mostram percentuais
- Últimas mensagens listadas
- Taxa de sucesso/erro calculada corretamente

## Checklist de Conclusão

- [x] Backend: Controller criado com 9 endpoints
- [x] Backend: Service com lógica completa
- [x] Backend: Module importado em app.module
- [x] Backend: Queue registrada em queues.module
- [x] Backend: Processor criado para BullMQ
- [x] Backend: CampaignExecutionService implementado
- [x] Frontend: AdminCampaignsPage implementado
- [x] Frontend: CampaignList componente
- [x] Frontend: CampaignDetail componente
- [x] Frontend: CreateCampaignDialog componente
- [x] Frontend: CampaignMetrics componente
- [x] Testes: 18 cenários de teste cobertos

## Troubleshooting

**Problema:** BullMQ não processa jobs
- Solução: Verificar Redis disponível: `redis-cli ping`
- Solução: Verificar logs do processor
- Solução: Verificar Evolution API acessível

**Problema:** Campanha não enfileira mensagens
- Solução: Verificar contatos existem com tag
- Solução: Verificar contatos têm optIn = true
- Solução: Verificar template existe e pertence ao usuário

**Problema:** Mensagens não são enviadas
- Solução: Verificar instâncias conectadas à Evolution API
- Solução: Verificar telefones válidos com DDI 55
- Solução: Verificar horário permitido

**Problema:** Taxa de erro muito alta
- Solução: Verificar Evolution API logs
- Solução: Verificar limites não estão sendo excedidos
- Solução: Verificar números de telefone válidos

## Próximas Melhorias

1. Suportar variáveis dinâmicas em templates
2. Suportar campanhas agendadas (futura)
3. Suportar segmentação avançada
4. Dashboard de campanhas em tempo real
5. Suportar A/B testing
