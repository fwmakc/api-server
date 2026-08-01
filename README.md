# API Server

> Domain CRUD server — reference implementation for building your own application.

## What is this?

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

## Related services

- [api-server-toolkit](https://github.com/fwmakc/api-server-toolkit) — CRUD engine, guards, columns
- [auth-server](https://github.com/fwmakc/auth-server) — JWT/OAuth2 provider
- [event-server](https://github.com/fwmakc/event-server) — Event broker
- [gateway-server](https://github.com/fwmakc/gateway-server) — Docker Compose, Nginx
