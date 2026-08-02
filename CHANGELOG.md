# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
