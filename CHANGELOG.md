# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2026-09-29
### Fixed
- Boot failed in production with "No storage driver defined … call initializeTransactionalContext()": the call was gated behind an undocumented TRANSACTIONAL env var while app.module.ts unconditionally wraps the DataSource with addTransactionalDataSource. Boot migrations (migrationsRun) exposed the mismatch. The context is now always initialized before TypeORM starts.

## [0.7.0] - 2026-09-29
### Changed
- Database schema is now owned exclusively by TypeORM migrations. DB_SYNCHRONIZE is removed: pending migrations are applied on every boot (hardcoded migrationsRun: true), so the first boot on an empty database initializes the schema.
### Fixed
- Entity index names aligned with the InitialSchema migration (`IDX_settings_group`, `IDX_posts_account`, `IDX_posts_category`): unnamed `@Index` declarations produced hash names and drifted from the migration schema. `migration:generate` against a migrated database is now a no-op.

## [0.6.1] - 2026-09-28
### Changed
- Node.js runtime bumped 22 → 24 LTS: Docker images `node:24-alpine`, CI `node-version: 24`.
- Toolkit pinned to `api-server-toolkit#v0.18.0` (adds `ApiKeyGuard` / `@ApiKey()`; no behavior change for existing routes).

## [0.5.0] - 2026-08-03

Version reset to pre-release. The API server is functional (368 tests, domain CRUD, access control, Swagger) but the overall stack is not yet production-hardened. Pinned to `api-server-toolkit#v0.9.0`.

## [2.0.1] - 2026-08-03

### Fixed
- Posts controller now declares `relations: ['tags', 'category', 'account']` whitelist. Without this, `filterRelations()` returned `undefined` for all relation requests, silently dropping nested data from API responses.
- Dockerfile now copies `api-server-toolkit/package.json` into `node_modules` before build. This ensures TypeScript resolves subpath exports (`api-server-toolkit/health`, `/bootstrap`, `/helper`) via the `typesVersions` field.

## [2.0.0] - 2026-08-03

### Stack v2 alignment
- Major version aligned with api-server-toolkit v2.x
- Pinned to `api-server-toolkit#v2.1.0`
- Domain CRUD API with EntityController, multi-layer access control
- TypeORM entities, Swagger docs, row-level security
- Event loop monitoring (extracted to app.metrics.ts)
- 368 tests
