# API Server

[![Tests](https://github.com/fwmakc/api-server/actions/workflows/test.yml/badge.svg)](https://github.com/fwmakc/api-server/actions/workflows/test.yml)
[![Version](https://img.shields.io/badge/version-v0.5.0-blue)](https://github.com/fwmakc/api-server/releases)
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
// src/posts/posts.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Posts } from "./posts.entity";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Posts])],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
```

Add `PostsModule` to `app.module.ts` imports. You now have full CRUD:

| Method | Route | Access |
|--------|-------|--------|
| GET | `/posts` | Public — list with pagination, filtering, relations |
| GET | `/posts/:id` | Public — single record |
| POST | `/posts` | Auth required — create |
| PATCH | `/posts/:id` | Auth + owner — update |
| DELETE | `/posts/:id` | Auth + owner — delete |
| GET | `/posts/count` | Public — count with filters |
| PATCH | `/posts/:id/:field/:position` | Auth + owner — sort position |

See [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) for access control
levels, relation whitelisting, field-level security, and the full `EntityController` API.

## Cloning api-server for a new project

1. Clone the repo
2. Delete example entities (`src/persons/`, `src/settings/`, etc.)
3. Add your own entities (see above)
4. Update `src/app.module.ts` — remove old modules, add yours
5. Update `.env` — set `DB_NAME` to your project's database
6. Run with `DB_SYNCHRONIZE=true` to auto-create tables (dev only)

## Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | HTTP port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_NAME` | api_server | Database name |
| `DB_SYNCHRONIZE` | true | Auto-create tables (dev only — use migrations in production) |
| `AUTH_SERVER_URL` | http://localhost:3001 | Auth server for JWT/JWKS verification |
| `INTERNAL_API_KEY` | — | Shared secret for service-to-service calls |
| `SWAGGER_PREFIX` | swagger | Swagger UI path |

See `.env.example` for the full list.

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

All services in the fwmakc stack share the same **major version**. Same major = guaranteed compatibility.

| Level | Scope | Example |
|-------|-------|---------|
| **Major** | Shared across ALL services. A breaking change in any service bumps the major for everyone. | toolkit 2.x → 3.0.0 ⟹ all services tag v3.0.0 |
| **Minor** | Independent per service. New features (additive). | auth-server 2.1.0 → 2.2.0 |
| **Patch** | Independent per service. Bug fixes. | event-server 2.0.0 → 2.0.1 |

### What triggers a major bump

A breaking change at any intersection point:

- **api-server-toolkit** — guards, columns, decorators, EntityController, bootstrap, services
- **event-server contracts** — DTO field removed/renamed, required field added
- **Inter-service API** — JWT claim format, `X-Internal-Api-Key` scheme, webhook contract
- **Public API** — any endpoint that another service depends on

### What does NOT trigger a major bump

- Bug fixes, performance improvements
- New features (additive — new optional fields, new endpoints)
- Internal refactoring that doesn't change interfaces

### Alignment process

When a service makes a breaking change (e.g., toolkit 2.x → 3.0.0):

1. The changing service bumps its major and tags the release
2. **All other services** get a stack alignment commit:
   - Bump `version` in `package.json`
   - Add CHANGELOG entry: `chore: stack v3 alignment`
   - Update dependency pins if needed
   - Tag `v3.0.0`
3. All services are now on stack v3

### Current versions

| Service | Version |
|---------|---------|
| [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) | v0.9.0 |
| [event-server](https://github.com/fwmakc/event-server) | v0.5.0 |
| [auth-server](https://github.com/fwmakc/auth-server) | v0.5.0 |
| [message-server](https://github.com/fwmakc/message-server) | v0.4.0 |
| [file-server](https://github.com/fwmakc/file-server) | v0.4.0 |
| [chat-server](https://github.com/fwmakc/chat-server) | v0.1.0 |
| [api-server](https://github.com/fwmakc/api-server) | v0.5.0 |
| [gateway-server](https://github.com/fwmakc/gateway-server) | v0.3.0 |
| [scaffold](https://github.com/fwmakc/scaffold) | v0.1.0 |
