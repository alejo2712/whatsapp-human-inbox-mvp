# WhatsApp Human Inbox MVP — CLAUDE.md

> Single source of truth for project plan, architecture, status, and next steps.
> Updated after each phase. Do NOT reread the full conversation — read this file.

---

## 1. Project Overview

A human agent inbox for receiving and replying to WhatsApp messages via Meta WhatsApp Business Cloud API.

Agents log in, see a conversation list, open a thread, and reply. Incoming webhooks create contacts/conversations/messages automatically.

---

## 2. Stack Decisions

| Layer       | Choice                                      | Reason                              |
|-------------|---------------------------------------------|-------------------------------------|
| Backend     | NestJS + TypeScript (strict)                | Modular, familiar, production-ready |
| Frontend    | Next.js 14 App Router + TypeScript          | SSR + client components             |
| Database    | PostgreSQL + Prisma                         | Relational, schema-as-truth         |
| Realtime    | Server-Sent Events (SSE)                    | Simple, no socket infra needed      |
| Auth        | JWT, HttpOnly cookie (access + refresh)     | Secure for web agents               |
| Package mgr | pnpm                                        | Fast, monorepo-friendly             |
| Monorepo    | pnpm workspaces                             | Simple, no Turborepo overhead       |
| Styling     | Tailwind CSS                                | Utility-first, fast iteration       |
| State       | React Query (server) + useState (local)     | Minimal, appropriate for inbox      |
| Infra       | Docker Compose (Postgres)                   | Local dev only in MVP               |

---

## 3. Monorepo Layout

```
whatsapp-human-inbox-mvp/
├── apps/
│   ├── api/          NestJS backend
│   └── web/          Next.js frontend
├── packages/
│   └── shared/       DTOs, enums, TypeScript types
├── docker/
│   └── docker-compose.yml
├── .env.example      root-level env template
├── package.json      pnpm workspace root
├── CLAUDE.md
└── README.md
```

---

## 4. Database Model

```
User (agent)
  id, email, password (bcrypt), name, role (ADMIN|OPERATOR), createdAt

Contact
  id, phone (E.164 unique), name?, metadata Json, createdAt, updatedAt

Conversation
  id, contactId (FK), status (OPEN|CLOSED), assignedUserId (FK)?, createdAt, updatedAt, lastMessageAt

Message
  id, conversationId (FK), direction (INBOUND|OUTBOUND), body, waMessageId (unique)?, status (SENT|DELIVERED|READ|FAILED), createdAt

MessageStatusEvent
  id, messageId (FK), status, timestamp, raw Json

AuditLog
  id, userId?, action, entity, entityId, metadata Json, createdAt
```

---

## 5. API Endpoints

### Auth
- POST /auth/login         — email + password → JWT cookie
- POST /auth/logout        — clear cookie
- GET  /auth/me            — current user

### Conversations
- GET  /conversations              — list (pagination, status filter)
- GET  /conversations/:id          — single with messages
- PATCH /conversations/:id         — update status

### Messages
- GET  /conversations/:id/messages — paginated message list
- POST /conversations/:id/messages — send outbound reply

### WhatsApp Webhook
- GET  /webhook/whatsapp           — Meta verification challenge
- POST /webhook/whatsapp           — inbound message/status events

### SSE
- GET  /sse/events                 — realtime stream for new messages/conversations

---

## 6. Environment Variables

All required values:

```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_inbox

# Auth
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh
JWT_REFRESH_EXPIRES_IN=7d

# Meta WhatsApp Cloud API
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_VERIFY_TOKEN=my_verify_token
META_GRAPH_API_VERSION=v20.0

# App
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
PORT=3001

# Seed
SEED_AGENT_EMAIL=agent@example.com
SEED_AGENT_PASSWORD=changeme123
```

---

## 7. Implementation Phases

### Phase 1 — Project scaffold and infrastructure  [STATUS: DONE]
- pnpm workspace setup
- apps/api NestJS skeleton
- apps/web Next.js skeleton
- packages/shared skeleton
- Docker Compose for Postgres
- Prisma schema + initial migration
- .env.example files
- README.md

### Phase 2 — Auth  [STATUS: DONE]
- User model, seed script
- Login / logout / me endpoints (POST /auth/login, POST /auth/logout, GET /auth/me)
- JWT HttpOnly cookie strategy (passport-jwt)
- Frontend login page (/login)
- Inbox layout with server-side auth check and redirect

### Phase 3 — WhatsApp webhook ingestion  [STATUS: DONE]
- Webhook verification GET (hub.verify_token check)
- Webhook POST handler
- Parse text messages and status events
- Upsert Contact, find-or-create Conversation (OPEN), create Message

### Phase 4 — Conversation and message API  [STATUS: DONE]
- GET /conversations (paginated, status filter)
- GET /conversations/:id (with messages)
- PATCH /conversations/:id (status update)
- GET /conversations/:id/messages (paginated)
- POST /conversations/:id/messages (send reply via Meta Cloud API)
- WhatsappService wrapping Meta Graph API

### Phase 5 — Frontend inbox  [STATUS: DONE]
- Conversation list page with OPEN/CLOSED tabs
- Conversation detail with message thread
- Reply input (Enter to send, Shift+Enter for newline)
- Message bubbles with timestamp and status icon
- Contact avatar initials

### Phase 6 — Realtime (SSE)  [STATUS: DONE]
- SseService (RxJS Subject)
- GET /sse/events endpoint (requires JWT cookie)
- WebhookService and MessagesService broadcast on new messages
- Frontend EventSource subscription in MessageThread component

### Phase 7 — Polish and hardening  [STATUS: DONE]
- ThrottlerModule wired (100 req/min global)
- CORS configured to FRONTEND_URL with credentials
- Global ValidationPipe (whitelist + transform)
- GlobalExceptionFilter with structured error responses
- Webhook payload typed and guarded
- README curl examples

---

## 8. Future Roadmap (not in MVP)

- Assignment queues and queue membership
- Conversation assignment to queue or specific agent
- Conversation transfers
- Conversation statuses: open / pending / closed
- Internal notes
- SLA timers
- Tags and smart filters
- Canned responses
- Media / attachment messages
- Template message sending
- Supervisor dashboard
- Metrics and reporting

---

## 9. Open Questions / Assumptions

- SSE chosen over WebSocket to avoid additional infra complexity in MVP.
- JWT stored as HttpOnly cookie (not localStorage) for security.
- Outbound replies are plain text only in MVP.
- Phone numbers stored in E.164 format.
- One conversation per contact (most recent active one) in MVP; multi-conversation per contact is a future feature.

---

## 10. Current Status

All 7 MVP phases complete. Both `tsc --noEmit` checks pass (API and web, zero errors).
Prisma client generated. First commit pushed to GitHub.

To run the project:
1. `docker compose -f docker/docker-compose.yml up -d`
2. `cd apps/api && pnpm prisma:migrate && pnpm prisma:seed`
3. `pnpm dev:api` (terminal 1) and `pnpm dev:web` (terminal 2)
4. Open http://localhost:3000 — login with agent@example.com / changeme123

Remaining before production:
- Fill META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID in apps/api/.env
- Add X-Hub-Signature-256 webhook signature validation
- Use a real JWT_SECRET (strong random string)
- Set FRONTEND_URL to the deployed web domain

---

## 11. Next Session Instructions

1. Read this CLAUDE.md fully.
2. All phases are DONE — project is functional MVP.
3. If continuing: focus on webhook signature validation, production env hardening,
   or beginning future roadmap items (see section 8).
4. Do not reinitialize or re-scaffold anything.

---

## 12. Completed Work Log

- [2026-05-28] Project initialized, full MVP built and pushed to GitHub.
  Phases 1–7 complete. TypeScript checks pass. 62 files, 2120 lines.
