# 🧪 Guia de Teste — Módulo Admin > Mídia

## ✅ O que foi implementado

### Backend
- ✅ `GET /api/media` — listar mídias com filtros
- ✅ `POST /api/media/upload` — upload de arquivo (Multer)
- ✅ `POST /api/media/text` — criar texto pronto
- ✅ `GET /api/media/:id` — detalhe de mídia
- ✅ `PATCH /api/media/:id` — editar nome/tags
- ✅ `DELETE /api/media/:id` — deletar mídia
- ✅ `GET /api/media/:id/preview` — preview do arquivo
- ✅ Storage abstrato (MinIO + fallback local)
- ✅ Geração automática de slugs únicos
- ✅ Permissões (apenas ADMIN)

### Frontend
- ✅ `AdminMediaPage.tsx` — tela principal (sem placeholder)
- ✅ `MediaUploadDialog.tsx` — dialog de upload
- ✅ `MediaCreateTextDialog.tsx` — dialog para criar texto
- ✅ `MediaList.tsx` — tabela com mídias
- ✅ `MediaPreviewDialog.tsx` — preview de imagem/vídeo/áudio/PDF
- ✅ `CopyVariableButton.tsx` — copiar variável para clipboard

## 🚀 Começar a Testar

### 1️⃣ Subir Docker (se não estiver rodando)

```bash
cd C:\Users\works\Desktop\AQUECEDOR EVO\evo-crm
docker compose up -d --build
```

**Esperar que todos os containers fiquem healthy:**
```bash
docker compose ps
```

### 2️⃣ Acessar o Frontend

```
http://localhost:5173
```

**Login com:**
- Email: `admin@local.com`
- Senha: `Admin@123456` (mude na primeira vez)

### 3️⃣ Navegar até Admin > Mídia

```
http://localhost:5173/admin/media
```

**Esperado:**
- ✅ Tela carrega sem erro
- ✅ Botões "Novo texto" e "Fazer upload" aparecem
- ✅ Tabela está vazia (primeira vez)
- ✅ Filtros por tipo e busca funcionam
- ✅ ApiStatusPill mostra status

---

## 🧪 Testes por Feature

### Teste 1: Upload de Imagem

**Passo 1:** Clique em "Fazer upload"

**Passo 2:** Selecione uma imagem do seu computador (ex: `test.jpg`)

**Passo 3:** Adicione tags: `teste,campanha`

**Passo 4:** Clique "Enviar"

**Esperado:**
- ✅ Toast verde: "Arquivo enviado com sucesso"
- ✅ Mídia aparece na tabela
- ✅ Slug gerado automaticamente (ex: `test`)
- ✅ Tipo: `IMAGE`
- ✅ Tamanho exibido em KB/MB
- ✅ Tags exibidas como badges
- ✅ Variável: `{{imagem:test}}`

---

### Teste 2: Upload de Áudio

**Passo 1:** Clique em "Fazer upload"

**Passo 2:** Selecione um arquivo de áudio (ex: `audio.mp3`)

**Passo 3:** Clique "Enviar"

**Esperado:**
- ✅ Mime type detectado corretamente
- ✅ Tipo: `AUDIO`
- ✅ Variável: `{{audio:audio}}`

---

### Teste 3: Upload de PDF

**Passo 1:** Clique em "Fazer upload"

**Passo 2:** Selecione um PDF (ex: `documento.pdf`)

**Passo 3:** Clique "Enviar"

**Esperado:**
- ✅ Tipo: `PDF`
- ✅ Variável: `{{documento:documento}}`

---

### Teste 4: Criar Texto Pronto

**Passo 1:** Clique em "Novo texto"

**Passo 2:** Preencha:
- Nome: `Saudação`
- Conteúdo: `Olá {{usuario:nome}}, bem-vindo à nossa campanha!`
- Tags: `boas-vindas,saudacao`

**Passo 3:** Clique "Criar"

**Esperado:**
- ✅ Toast verde: "Texto criado com sucesso"
- ✅ Tipo: `TEXT`
- ✅ Tamanho: número de bytes do conteúdo
- ✅ Variável: `{{texto:saudacao}}`
- ✅ Sem arquivo (publicUrl = null)

---

### Teste 5: Preview de Imagem

**Passo 1:** Na tabela, na linha da imagem, clique no ícone de "olho" (preview)

**Esperado:**
- ✅ Dialog abre
- ✅ Imagem renderizada
- ✅ Título do dialog mostra o nome

---

### Teste 6: Preview de Áudio

**Passo 1:** Na tabela, na linha do áudio, clique no ícone de "olho"

**Esperado:**
- ✅ Dialog abre
- ✅ Player de áudio com controles (play, pause, volume)

---

### Teste 7: Preview de PDF

**Passo 1:** Na tabela, na linha do PDF, clique no ícone de "olho"

**Esperado:**
- ✅ Dialog abre
- ✅ PDF renderizado (iframe com visualizador)

---

### Teste 8: Copiar Variável

**Passo 1:** Na tabela, clique no ícone de "copiar" ao lado da variável

**Esperado:**
- ✅ Toast verde: "Variável copiada"
- ✅ Ícone muda para checkmark verde por 2 segundos
- ✅ Variável copiada para clipboard
- ✅ Cole em um campo de texto (Ctrl+V) para confirmar

---

### Teste 9: Download de Arquivo

**Passo 1:** Na tabela, clique no ícone de "download"

**Esperado:**
- ✅ Arquivo baixado (browser download)
- ✅ Nome do arquivo correto

---

### Teste 10: Editar Mídia (Nome/Tags)

*Nota: Componente de edit pode estar simples por enquanto*

**Via API:**
```bash
curl -X PATCH http://localhost:3000/api/media/{ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Novo nome",
    "tags": "nova-tag1,nova-tag2"
  }'
```

**Esperado:**
- ✅ Resposta 200 OK
- ✅ Nome atualizado
- ✅ Tags atualizadas

---

### Teste 11: Deletar Mídia

**Passo 1:** Na tabela, clique no ícone de "trash" (lixo)

**Passo 2:** Confirme no dialog

**Esperado:**
- ✅ Toast verde: "Mídia deletada"
- ✅ Mídia desaparece da tabela
- ✅ Arquivo removido do storage (MinIO ou local)

---

### Teste 12: Buscar/Filtrar

**Teste 12a: Buscar por nome**
- Preencha o campo de busca: `Saudação`
- Esperado: ✅ Apenas o texto com nome "Saudação" aparece

**Teste 12b: Filtrar por tipo**
- Selecione: `Imagem`
- Esperado: ✅ Apenas imagens aparecem

**Teste 12c: Buscar por tag**
- Digite na busca: `campanha`
- Esperado: ✅ Apenas mídias com tag "campanha" aparecem

---

### Teste 13: Storage (MinIO vs Local)

**Verificar se MinIO está sendo usado:**
```bash
# Acessar console MinIO
http://localhost:9001

# Login:
# User: minio
# Password: minio_dev_password

# Verificar bucket "evo-crm"
```

**Se MinIO falhar, verificar se arquivo foi para local:**
```bash
ls -la C:\Users\works\Desktop\AQUECEDOR EVO\evo-crm\storage\uploads
```

---

## 📊 Teste de Permissão

### Teste 14: Apenas ADMIN pode acessar

**Passo 1:** Login com usuário `USER` (não ADMIN)

**Passo 2:** Tente acessar `/admin/media`

**Esperado:**
- ✅ Redirecionado ou mensagem de acesso negado

---

## 🔧 Testes via API (cURL)

### Listar mídias
```bash
curl http://localhost:3000/api/media?type=IMAGE \
  -H "Authorization: Bearer {TOKEN}"
```

### Upload
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@/path/to/file.jpg" \
  -F "tags=teste,tag2" \
  -H "Authorization: Bearer {TOKEN}"
```

### Criar texto
```bash
curl -X POST http://localhost:3000/api/media/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Texto teste",
    "content": "Conteúdo aqui",
    "tags": "tag1,tag2"
  }'
```

### Deletar
```bash
curl -X DELETE http://localhost:3000/api/media/{ID} \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 🐛 Troubleshooting

### "Nenhuma mídia cadastrada"
- Normal se é primeira vez. Faça upload de um arquivo.

### Upload falha
- Verificar tamanho do arquivo (máximo 25MB)
- Verificar tipos aceitos (image, video, audio, pdf, doc)
- Verificar logs do backend: `docker compose logs -f backend`

### Imagem não aparece
- Verificar se MinIO está rodando: `docker compose ps`
- Verificar se arquivo foi para `/storage/uploads` (fallback local)

### Variável não copia
- Verificar se browser permite clipboard (HTTPS em produção)
- Tentar manual: copiar do campo de código

### Preview não abre
- PDF precisa de um visualizador (iframe)
- Áudio precisa de suporte no browser

---

## 📝 Checklist Final

- [ ] Tela AdminMediaPage abre sem erros
- [ ] Upload de imagem funciona
- [ ] Upload de áudio funciona
- [ ] Upload de vídeo funciona
- [ ] Upload de PDF funciona
- [ ] Criar texto funciona
- [ ] Variáveis copiáveis funcionam
- [ ] Preview de imagem funciona
- [ ] Preview de áudio funciona
- [ ] Preview de PDF funciona
- [ ] Delete funciona
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] Docker continua rodando
- [ ] Banco de dados salva as mídias

---

## ✅ Sucesso!

Se tudo passou nos testes acima, o módulo **Admin > Mídia** está **100% funcional**! 🎉

Próximos passos:
1. Integrar mídia em templates
2. Integrar mídia em campanhas
3. Implementar Inbox
4. Deploy em produção
