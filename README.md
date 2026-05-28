# WhatsApp Human Inbox MVP

A human agent inbox for receiving and replying to WhatsApp messages via Meta WhatsApp Business Cloud API.

## Stack

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 14 App Router + Tailwind CSS
- **Realtime**: Server-Sent Events (SSE)
- **Auth**: JWT via HttpOnly cookie
- **Package manager**: pnpm (monorepo workspaces)

## Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL)
- A Meta WhatsApp Business Cloud API account

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` and fill in:
- `META_WHATSAPP_ACCESS_TOKEN` — from Meta Developer Console
- `META_WHATSAPP_PHONE_NUMBER_ID` — from Meta Developer Console
- `META_WHATSAPP_VERIFY_TOKEN` — any string you choose (used for webhook verification)
- `JWT_SECRET` — a strong random string

### 4. Run database migration and seed

```bash
cd apps/api
pnpm prisma:migrate   # runs: prisma migrate dev
pnpm prisma:generate  # generates Prisma client
pnpm prisma:seed      # creates default agent user
```

Default agent credentials (from seed):
- Email: `agent@example.com`
- Password: `changeme123`

### 5. Start dev servers

In separate terminals:

```bash
# Terminal 1 — API (port 3001)
pnpm dev:api

# Terminal 2 — Web (port 3000)
pnpm dev:web
```

Open http://localhost:3000 and log in.

---

## Meta Webhook Setup

1. In the Meta Developer Console, configure the webhook URL:
   ```
   https://your-domain.com/api/webhook/whatsapp
   ```
2. Set the **Verify Token** to match `META_WHATSAPP_VERIFY_TOKEN` in your `.env`.
3. Subscribe to the `messages` field.

For local development, use [ngrok](https://ngrok.com/) or a similar tunnel:
```bash
ngrok http 3001
```
Then use the HTTPS URL as your webhook endpoint.

---

## API curl Examples

### Webhook verification (Meta calls this automatically)
```bash
curl "http://localhost:3001/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=my_verify_token&hub.challenge=test123"
```

### Simulate an inbound WhatsApp message
```bash
curl -X POST http://localhost:3001/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "contacts": [{"wa_id": "5491112345678", "profile": {"name": "Test User"}}],
          "messages": [{
            "id": "wamid.test001",
            "from": "5491112345678",
            "timestamp": "1700000000",
            "type": "text",
            "text": {"body": "Hello, I need help!"}
          }]
        }
      }]
    }]
  }'
```

### Login and get auth cookie
```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"changeme123"}'
```

### List conversations (requires auth cookie)
```bash
curl -b cookies.txt http://localhost:3001/api/conversations
```

### Send a reply
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/conversations/<CONVERSATION_ID>/messages \
  -H "Content-Type: application/json" \
  -d '{"body":"Thanks for reaching out! How can I help?"}'
```

---

## Project Structure

```
whatsapp-human-inbox-mvp/
├── apps/
│   ├── api/                NestJS backend
│   │   ├── src/
│   │   │   ├── auth/       Login, JWT strategy
│   │   │   ├── conversations/
│   │   │   ├── messages/   Send and list messages
│   │   │   ├── webhook/    Meta webhook handler
│   │   │   ├── whatsapp/   Meta Cloud API client
│   │   │   ├── sse/        Server-Sent Events
│   │   │   └── prisma/     PrismaService
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/                Next.js frontend
│       └── src/
│           ├── app/        App Router pages
│           ├── components/ UI components
│           └── lib/        API client, auth helpers
├── packages/
│   └── shared/             Shared enums and TypeScript types
├── docker/
│   └── docker-compose.yml  PostgreSQL
└── CLAUDE.md               Project plan and status
```

---

## Future Roadmap

See `CLAUDE.md` section 8 for the full list of planned features (queues, transfers, SLA, templates, etc.)
