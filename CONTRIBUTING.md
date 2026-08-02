# Contributing to api-server

Thanks for your interest in contributing! This service is part of the
[fwmakc microservices stack](https://github.com/fwmakc/gateway-server).

## Prerequisites

- **Node.js** 20+ (`node -v`)
- **npm** 10+
- **PostgreSQL** 14+ (or use Docker: `docker compose up -d postgres`)

## Development Setup

```bash
git clone https://github.com/fwmakc/api-server.git
cd api-server
cp .env.example .env
# Set DB_SYNCHRONIZE=true for dev schema sync
npm install
npm run dev
```

Service runs on port **5000**. Swagger UI at `http://localhost:5000/swagger`.

## Testing

```bash
npm test
```

368 tests. Tests use real PostgreSQL with `dropSchema: true` +
`synchronize: true`. Tests cover: CRUD operations, access control, search,
relations, pagination.

## Code Style

- TypeScript with strict type checking
- NestJS conventions (modules, controllers, services, DTOs)
- Use `EntityController` for auto-generated CRUD routes
- Use toolkit columns (`IdColumn`, `VarcharColumn`, etc.)
- Use `@FieldAccess()` for field-level access control
- See `AGENTS.md` for detailed conventions

## Pull Request Process

1. Fork the repo, create a branch from `master`
2. Make your changes
3. Ensure tests pass: `npm test`
4. Ensure TypeScript compiles: `npm run build`
5. Create a pull request with a clear description
