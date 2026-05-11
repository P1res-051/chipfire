# Módulo Media — Biblioteca de Mídia

## Overview

Módulo completo para gestão de mídia (imagens, vídeos, áudios, PDFs, documentos, textos) com suporte a **MinIO** (S3-compatible) ou **storage local**.

## Features

- ✅ Upload de arquivos (Multer)
- ✅ Suporte a múltiplos tipos (IMAGE, VIDEO, AUDIO, PDF, DOCUMENT, TEXT)
- ✅ Armazenamento em MinIO com fallback para local
- ✅ Geração de slugs únicos
- ✅ Sistema de tags
- ✅ Variáveis reutilizáveis em templates/campanhas
- ✅ Preview (imagem, vídeo, áudio, PDF)
- ✅ Permissões (apenas ADMIN)

## APIs

### GET /api/media
Lista mídias do usuário com filtros.

**Query params:**
- `type`: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'TEXT'
- `search`: buscar por nome/slug/tag
- `tag`: filtrar por tag específica
- `limit`: limite de itens (padrão 50, máximo 100)
- `offset`: paginação

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "name": "Foto da campanha",
      "slug": "foto-da-campanha",
      "type": "IMAGE",
      "publicUrl": "http://localhost:9000/evo-crm/...",
      "mimeType": "image/jpeg",
      "size": 2048,
      "tags": ["campanha", "2024"],
      "variable": "{{imagem:foto-da-campanha}}",
      "createdAt": "2024-05-10T..."
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### POST /api/media/upload
Upload de arquivo.

**Form data:**
- `file`: File (multipart)
- `tags`: string (opcional, separadas por vírgula)

**Constraints:**
- Máximo 25MB (configurável em `.env`)
- Tipos aceitos: imagem, vídeo, áudio, PDF, documentos

**Response:**
```json
{
  "id": "...",
  "name": "Minha imagem",
  "slug": "minha-imagem",
  "type": "IMAGE",
  "publicUrl": "http://localhost:9000/evo-crm/...",
  "mimeType": "image/jpeg",
  "size": 51200,
  "tags": ["tag1", "tag2"],
  "variable": "{{imagem:minha-imagem}}",
  "filePath": "minio://evo-crm/minha-imagem-1715379654321.jpg"
}
```

### POST /api/media/text
Criar texto pronto (sem arquivo).

**Body:**
```json
{
  "name": "Saudação",
  "content": "Olá {{usuario:nome}}, bem-vindo!",
  "tags": "boas-vindas,campanha"
}
```

**Response:**
```json
{
  "id": "...",
  "name": "Saudação",
  "slug": "saudacao",
  "type": "TEXT",
  "content": "Olá {{usuario:nome}}, bem-vindo!",
  "size": 35,
  "tags": ["boas-vindas", "campanha"],
  "variable": "{{texto:saudacao}}"
}
```

### GET /api/media/:id
Detalhe de mídia.

### PATCH /api/media/:id
Editar nome e tags.

**Body:**
```json
{
  "name": "Novo nome",
  "tags": "nova-tag1,nova-tag2"
}
```

### DELETE /api/media/:id
Deletar mídia (arquivo + registro banco).

### GET /api/media/:id/preview
Baixar/fazer preview do arquivo.

**Response:** Stream do arquivo com `Content-Type` apropriado.

## Storage

### MinIO (Padrão)

Se `MINIO_ENABLED=true`:
- Arquivos armazenados em bucket `${MINIO_BUCKET}`
- URL pública: `http://localhost:9000/{bucket}/{filename}`
- Fallback automático para local se MinIO falhar

### Local Storage (Fallback)

Se MinIO indisponível:
- Arquivos em `/storage/uploads` (persistente via Docker volume)
- URL pública: `/storage/uploads/{filename}`
- Acesso via Nginx/Traefik em produção

## Variables

Cada mídia tem uma variável única para reutilização:

| Tipo | Variable |
|------|----------|
| IMAGE | `{{imagem:slug}}` |
| VIDEO | `{{video:slug}}` |
| AUDIO | `{{audio:slug}}` |
| PDF | `{{documento:slug}}` |
| DOCUMENT | `{{documento:slug}}` |
| TEXT | `{{texto:slug}}` |

**Uso em templates:**
```
Olá! Aqui está sua foto: {{imagem:minha-foto}}

Escute isso: {{audio:musica-fundo}}

Confira nosso documento: {{documento:relatorio-2024}}
```

## Permissions

- ✅ Apenas usuários com role `ADMIN` podem acessar
- ✅ Cada mídia pertence a um usuário (multi-tenant)
- ✅ Usuários só veem suas próprias mídias

## Configuration

No `.env`:
```env
MINIO_ENABLED=true
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio_dev_password
MINIO_ENDPOINT=http://minio:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_BUCKET=evo-crm
MAX_MEDIA_SIZE_MB=25
```

## Dependencies

- `@nestjs/platform-express` (Multer)
- `minio` (S3-compatible client)
- `@prisma/client` (ORM)
- `zod` (validação)

## Files

```
src/media/
├── media.controller.ts       → Rotas HTTP
├── media.service.ts          → Lógica de negócio
├── media.module.ts           → Módulo NestJS
├── storage.service.ts        → Abstração de storage
├── dto/
│   ├── upload-media.dto.ts
│   ├── create-text-media.dto.ts
│   └── update-media.dto.ts
└── README.md                 → Este arquivo
```

## Testing

### Upload via API
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@/path/to/image.jpg" \
  -F "tags=campanha,2024" \
  -H "Authorization: Bearer {TOKEN}"
```

### Criar texto
```bash
curl -X POST http://localhost:3000/api/media/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Boas-vindas",
    "content": "Olá {{usuario:nome}}!",
    "tags": "boas-vindas"
  }'
```

### Listar
```bash
curl http://localhost:3000/api/media?type=IMAGE \
  -H "Authorization: Bearer {TOKEN}"
```

## Notes

- Slugs são gerados automaticamente a partir do nome do arquivo
- Slugs são únicos por usuário
- Tamanho máximo é configurável (padrão 25MB)
- MinIO usa bucket único por aplicação
- Fallback para storage local é automático e transparente
- Textos não têm arquivo, apenas conteúdo
