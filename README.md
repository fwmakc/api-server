# API Server

[![Tests](https://github.com/fwmakc/api-server/actions/workflows/test.yml/badge.svg)](https://github.com/fwmakc/api-server/actions/workflows/test.yml)
[![Version](https://img.shields.io/badge/version-v0.6.0-blue)](https://github.com/fwmakc/api-server/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/fwmakc/api-server/blob/master/LICENSE)

> Reference implementation: domain CRUD pattern — EntityController, access levels, relation whitelisting, batch-loader.

## What This Is

A working scaffold for domain-specific CRUD APIs. Part of a
[microservices stack](https://github.com/fwmakc/gateway-server) — this is the service you
clone and customize with your own entities (persons, posts, courses, orders, etc.).

Built on [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit), which provides
the generic `EntityController` with 4-layer access control, relation whitelisting, and
field-level security.

## Role in the stack

```
api-server ↔ auth-server (JWT verification via JWKS)
api-server ↔ event-server (publish domain events)
api-server ↔ PostgreSQL (shared instance, own database)
api-server → nginx → client (REST API)
```

**Dependencies:** auth-server (JWT), PostgreSQL
**Dependents:** nginx (routes default traffic here)

## Pattern

This service demonstrates the **domain CRUD pattern** in the toolkit stack:

- **EntityController** — 10 routes auto-generated from entity + service
- **Access levels** — `operations: { read: 'public', create: 'owner' }`, declarative
- **Relation whitelisting** — `relations: ['tags', 'category']` in controller, enforced
- **Batch-loader** — separate queries per relation, N+1 → 2 queries
- **Field-level security** — `@FieldAccess({ read: 'owner' })` on entity fields

Clone this when you need: your application's domain API (persons, posts, orders, courses).

## Quick start

```bash
# Using Docker (from gateway-server)
docker compose up -d api-server

# Local development
cp .env.example .env
npm install --legacy-peer-deps
npm run dev
```

## Adding a new entity

This is the core workflow — how you build your application.

### 1. Create an entity

```typescript
// src/posts/posts.entity.ts
import { IdColumn, VarcharColumn, TextColumn, CreatedColumn } from "api-server-toolkit";
import { Entity } from "typeorm";

@Entity("posts")
export class Posts {
  @IdColumn()
  id: number;

  @VarcharColumn()
  title: string;

  @TextColumn()
  content: string;

  @CreatedColumn()
  createdAt: Date;
}
```

### 2. Create a DTO

```typescript
// src/posts/posts.dto.ts
import { DtoColumn, DtoCreatedColumn } from "api-server-toolkit";

export class PostsDto {
  @DtoColumn()
  id?: number;

  @DtoColumn()
  title?: string;

  @DtoColumn()
  content?: string;

  @DtoCreatedColumn()
  createdAt?: Date;
}
```

### 3. Create a service

```typescript
// src/posts/posts.service.ts
import { CommonService } from "api-server-toolkit";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Posts } from "./posts.entity";

@Injectable()
export class PostsService extends CommonService<Posts> {
  constructor(@InjectRepository(Posts) repository: Repository<Posts>) {
    super(repository);
  }
}
```

### 4. Create a controller

```typescript
// src/posts/posts.controller.ts
import { EntityController, Data, Doc } from "api-server-toolkit";
import { Controller } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostsDto } from "./posts.dto";

@Controller("posts")
export class PostsController extends EntityController<Posts, PostsDto>(PostsDto) {
  constructor(service: PostsService) {
    super(service);
  }
}
```

### 5. Wire up the module

```typescript
// src/db/posts/posts.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsEntity } from "./posts.entity";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PostsEntity])],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
```

Add `PostsModule` to `app.imports.ts`. You now have full CRUD:

| Method | Route | Access |
|--------|-------|--------|
| GET | `/posts/find` | Public — list with pagination, filtering, relations |
| GET | `/posts/find/:id` | Public — single record |
| GET | `/posts/count` | Public — count with filters |
| POST | `/posts/create` | Auth required — create |
| PATCH | `/posts/update/:id` | Auth + owner — update |
| DELETE | `/posts/remove/:id` | Auth + owner — delete |
| GET | `/posts/self` | Auth — own records only (owner level) |

See [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) for access control
levels, relation whitelisting, field-level security, and the full `EntityController` API.

## Cloning api-server for a new project

1. Clone the repo
2. Delete example entities (`src/db/settings/`, etc.)
3. Add your own entities (see above)
4. Update `src/app.imports.ts` — remove old modules, add yours
5. Update `.env` — set `DB_NAME` to your project's database
6. Generate the first migration for your entities: `npm run migration:auto` (schema is owned by migrations — the app applies pending migrations on every boot, including the first one on an empty database)

## Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | HTTP port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_NAME` | api_server | Database name |
| `AUTH_SERVER_URL` | http://localhost:3001 | Auth server for JWT/JWKS verification |
| `AUTH_CACHE_TTL` | 30000 | Auth cache TTL in ms (account info from auth-server) |
| `CORS_ORIGIN` | * | Comma-separated allowed origins |
| `INTERNAL_API_KEY` | — | Shared secret for service-to-service calls |
| `EVENT_SERVER_URL` | http://event-server:3005 | Event bus (accounts-mirror subscription) |
| `WEBHOOK_URL` | — | Overrides the per-replica default webhook url (own container hostname) — use for single-instance mode |
| `WEBHOOK_SECRET` | — | HMAC secret for signed deliveries (same value as event-server's) |
| `SWAGGER_PREFIX` | swagger | Swagger UI path |

See `.env.example` for the full list.

## Migrations

The database schema is owned exclusively by TypeORM migrations (`src/typeorm/migrations`) — `synchronize` is not used anywhere. The app applies pending migrations on every boot, so the first boot on an empty database initializes the schema.

```bash
npm run migration:auto    # generate a migration from entity changes
npm run migration:run     # apply pending migrations (usually unnecessary — boot does it)
npm run migration:revert  # revert the last migration
```

CI verifies on every push that the migration chain builds the schema from scratch and that entities have no drift against it (a generated diff must be empty).

Writing migrations for zero-downtime deploys (expand-contract): ship additive changes first (add nullable column, write to both), remove old columns in a later release — never rename or drop in one step. With multiple replicas of this service, move migration out of boot: disable `migrationsRun` in `src/config/db.config.ts` and run `migration:run` once per deploy (from CI or a one-shot container) before rolling new code.

## Accounts mirror (event-driven projection)

`posts.account_id` carries a real FK to the local `accounts` table, but accounts are owned by auth-server — api-server keeps a **read-only projection** so owner-scoped writes survive the FK. There is no CRUD route for accounts; rows are written only from the event bus.

- **Receiver**: `POST /webhooks/events` behind the toolkit `EventDeliveryGuard` (HMAC `X-Event-Signature` when `WEBHOOK_SECRET` is set, legacy shared `X-Internal-Api-Key` otherwise). Raw-body parsing is on (`rawBody: true`) — signatures verify over the exact bytes.
- **Patterns**: `user.registered` → insert (`is_activated = !confirmUrl`), `user.confirmed` → activate (also self-heals a lost `registered`), `user.deactivated` → deactivate, `user.deleted` → delete, `user.roles_changed` → no mirror write (roles live in auth-server). A delete blocked by referencing posts (FK `NO ACTION`) keeps the row as an inert tombstone — posts stay joinable, login is impossible (the account is gone upstream).
- **Cache invalidation**: every delivery of `user.deactivated` / `user.deleted` / `user.roles_changed` also drops the auth-client cache entry for that user — **on every delivery, outside the `webhook_processed_events` ledger**. The ledger dedupes mirror writes (they must apply once), but each replica owns its own auth cache, so invalidation must run per replica. This closes the multi-replica gap where a role revocation stayed visible for up to the cache TTL (30 s) on replicas other than the one that issued the token check. Remaining TTL-bound edge: renaming a role itself (`roles.controller` update) does not emit the event — holders' caches age out naturally.
- **Ordering safety**: `registered` uses `ON CONFLICT (id) DO NOTHING`, so a redelivered registration can never re-deactivate a confirmed account; every delivery is marked in `webhook_processed_events` in the same transaction as the mutation (crash = retry, never double-apply).
- **Credentials**: the mirror never stores passwords — the `password` column stays at its empty default and is response-stripped by the field rules in `PermissionRegistry`.
- **Backfill** (one-off per live install — events cover only new registrations):
  ```bash
  # from gateway-server stack (or locally with AUTH_SERVER_URL pointing at auth)
  node -r tsconfig-paths/register dist/scripts/backfill-accounts.js
  # → {"status":"ok","mirrored":N,"existing":M}   idempotent, safe to re-run
  ```
- **Subscription**: on boot the service registers with event-server (`service: api-server`, the five patterns above). The default webhook url is `http://<container-hostname>:5000[/PREFIX]/webhooks/events` — subscriptions key on `(service, url)`, so each `--scale` replica registers as its own subscriber and every one receives the delivery (per-replica fan-out; a dead replica is dropped by event-server's circuit breaker — `subscriber.deactivated` noise is expected). Set `WEBHOOK_URL` to override for single-instance mode. Other env: `EVENT_SERVER_URL`, `WEBHOOK_SECRET` (same value as event-server's to enable signed delivery).

## API reference

- **Swagger UI**: `http://localhost:5000/swagger`
- **ReDoc**: `http://localhost:5000/redoc`
- **Health**: `http://localhost:5000/health`

## Migration & replacement

**Already have a CRUD API?** Map your existing endpoints to `EntityController` operations
one entity at a time. The toolkit's access control model is additive — you can start with
public access and tighten per entity.

**Migrating from a monolith?** This service IS the monolith minus auth, files, email, and
events (those were extracted to separate services). Add your domain entities here.

## AI-Friendly Documentation

This service is designed for AI-assisted development. You can feed context
to any LLM (ChatGPT, Claude, Cursor, Copilot) and get code that follows
all conventions — without reading the entire codebase.

### ai-context.md
Auto-generated structured reference: every controller, route, service,
entity, and DTO. Run `npm run ai-context` to regenerate. Feed it to any
LLM and ask it to generate a new entity — it produces code that matches
your conventions on the first try.

### ai-declarations.md
Toolkit TypeScript type declarations, shipped inside `api-server-toolkit/`.
The LLM knows every column type, guard, and decorator available.

### Swagger UI
Interactive API exploration at `/swagger` — test endpoints live,
see request/response schemas, copy curl commands.

### ReDoc
Clean, readable documentation at `/redoc` — share with your team,
generate client SDKs.

### Why this matters
Traditional onboarding for a new service: read the source code for days.
AI-assisted onboarding: feed `ai-context.md` to an LLM, ask it to create
a new entity with relations, access control, and Swagger docs. It produces
correct code that follows all patterns — first time, every time.

## Backend-Only — Bring Your Own Frontend

This service provides the complete backend CRUD API. No frontend included.

All APIs are REST + JSON, fully documented via Swagger/ReDoc. Build your
frontend in React, Vue, Next.js, Nuxt, React Native, Flutter — anything
that speaks HTTP. The auth flow is standard OAuth2, so any OAuth2 client
library works.

You get a production-ready backend without the pain of wiring it up yourself.

## Related services

- [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) — CRUD engine, guards, columns
- [auth-server](https://github.com/fwmakc/auth-server) — JWT/OAuth2 provider
- [event-server](https://github.com/fwmakc/event-server) — Event broker
- [gateway-server](https://github.com/fwmakc/gateway-server) — Docker Compose, Nginx

---

## Versioning

Each service versions **independently** (semver): a `vX.Y.Z` git tag marks the released state of each repo. There is no stack-wide shared major — compatibility is guaranteed by **exact dependency pins**, not by version numbers.

- Repos on `0.x` (toolkit, api/auth/file/message-server, gateway): the minor carries breaking changes while the stack is in development; patch = fixes.
- `event-server` follows a `1.x` line (stable event-contract surface).
- Consumers pin sources by tag: `"api-server-toolkit": "github:fwmakc/api-server-toolkit#v0.32.0"`, `"event-server": "github:fwmakc/event-server#v1.5.0"`.

### Breaking-change procedure

1. Bump the source repo (toolkit or event-server), tag the release, push.
2. In each consumer: bump the pin in `package.json` (a dedicated `build: pin …` commit), run the tests, push.
3. Update the `Current versions` table below in every repo so it keeps reflecting the actual tags.

### Current versions

> Synced across all repos on 2026-10-07. Source of truth: the `v*` git tags at each repo HEAD.

| Service | Version |
|---------|---------|
| [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) | v0.32.0 |
| [event-server](https://github.com/fwmakc/event-server) | v1.5.0 |
| [auth-server](https://github.com/fwmakc/auth-server) | v0.13.0 |
| [message-server](https://github.com/fwmakc/message-server) | v0.7.0 |
| [file-server](https://github.com/fwmakc/file-server) | v0.8.1 |
| [chat-server](https://github.com/fwmakc/chat-server) | v0.1.3 (frozen) |
| [api-server](https://github.com/fwmakc/api-server) | v0.8.0 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | v0.6.0 (infra) |
| [api-server-scaffold](https://github.com/fwmakc/api-server-scaffold) | v0.1.5 |
