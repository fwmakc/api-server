# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-10-06
### Added
- **Accounts mirror — event-driven projection** (closes the wave-6 HIGH
  finding «accounts-mirror seam»). `posts.account_id` держит реальный FK
  на локальную таблицу `accounts`, но аккаунты принадлежат auth-server —
  теперь api-server подписан на шину (`POST /webhooks/events`, guard
  `EventDeliveryGuard`: HMAC `WEBHOOK_SECRET` / легаси internal-key) и
  ведёт read-only проекцию: `user.registered` (insert, `is_activated =
  !confirmUrl`), `user.confirmed` (activate + self-heal потерянного
  register), `user.deactivated`, `user.deleted` (при FK-конфликте от
  постов — инертный tombstone). Дедупликация через
  `webhook_processed_events` в одной транзакции с мутацией (краш = ретрай,
  никогда двойное применение); `registered` идёт через `ON CONFLICT DO
  NOTHING` — повторная доставка не разактивирует подтверждённый аккаунт.
  Пароли зеркалом не хранятся. CRUD-маршрута у зеркала нет.
- **`scripts/backfill-accounts.ts`** — разовый бэкфилл существующих
  аккаунтов через новый internal-листинг auth-server
  (`GET /account/internal/list`, курсорный обход), идемпотентен
  (ON CONFLICT DO NOTHING, `RETURNING`-счётчики mirrored/existing).
- main.ts: `rawBody: true` (HMAC верифицируется над точными байтами);
  подписка на event-server при бутстрапе (patterns: 4 lifecycle-события,
  retry с backoff, `WEBHOOK_URL`/`WEBHOOK_SECRET`/`PREFIX`).

## [0.9.0] - 2026-10-07
### Added
- **Кросс-репличная инвалидация auth-client через шину событий**: каждая доставка `user.roles_changed` / `user.deactivated` / `user.deleted` сбрасывает кэш auth-client для этого пользователя — вне ledger (`webhook_processed_events` дедуплицирует только мутации зеркала, у каждой реплики свой кэш). Подписки: `user.roles_changed` добавлен в паттерны; webhook-url по умолчанию строится от hostname контейнера — N реплик = N подписчиков в event-server (per-replica fan-out), `WEBHOOK_URL` перекрывает для одиночного режима. Пин event-server#v1.6.0 (`UserRolesChangedDto`).
### Fixed
- **Docker-сборка с чистого кэша снова работает** (три независимых излома): (1) `npm prune` после `COPY api-server/ .` видел оригинальный package.json с git-пином тулкита и падал `spawn git ENOENT` (в alpine нет git) — stub-rewrite теперь применяется повторно после COPY, а `tsc` перенесён ДО prune (prune срезает typescript, и `npx tsc` без него ставит пакет-пустышку `tsc`). (2) `tsconfig.build.json` без `rootDir`: `allowJs` втягивал `scripts/wiring.ts` + `audit-gate.mjs`, rootDir поднимался до корня проекта, и образ собирался как `dist/src/main.js`, который `CMD dist/main` не находит — `rootDir: src` + exclude `scripts` возвращает `dist/main.js`. (3) `@types/babel__generator` (нужен tsconfig `types`) был только транзитивной dev-зависимостью и вырезался prune — теперь явная dependencies-запись.

### Tests
- `scripts/wiring.ts`: кредиты БД переопределяются через env (`DB_PASSWORD`), дефолт не изменился.

### Tests
- **Wiring-проверка реального бута** (`scripts/wiring.ts`, `npm run test:wiring`): поднимает настоящий `AppModule` в контексте приложения на чистой БД `api_server_wiring_test` (drop/create + реальные boot-миграции через `runMigrationsUnderLock` — ловит дрейф entity↔migrations, который не видят существующие сьюты на тестовых сущностях с `synchronize: true`), затем живые пробы: валидация `AccessModule.forRoot`, settings create/read-back, posts create/read-back с bind. 5/5 проверок, exit code для CI. Запуск через ts-node (не jest — под jest-рантаймом бут полного AppModule портит кэш модуля `pg`, гонка jest-only, в проде не воспроизводится).
- CI: новый job `wiring` с TZ-матрицей (UTC + Europe/Moscow).

## [0.7.9] - 2026-10-02
### Security (Wave 6)
- **Вложенный `account` у постов больше не сливает email и служебные флаги**: username (= email) теперь виден только аутентифицированным, `isActivated`/`isSuperuser` — только superuser (rules в PermissionRegistry для AccountEntity, применяются ко всем вложенным появлениям). Раньше аноним через `GET /posts?relations=account` получал email автора и его привилегии — перечисление адресов + раскрытие служебного статуса.
- **`settings.value` скрыт от анонимов** (field-rule: response — authenticated): публичный read отдаёт `default`; живое значение может разойтись с дефолтом и содержать внутренние данные.
- **Swagger-описание `posts.secretNotes` приведено к фактическим правилам** (editor/admin, а не «read/write — owner», как было написано).

### Tests
- `account-settings-field-rules.spec` — регрессии на реальных сущностях: аноним не видит username/password/флаги аккаунта, authenticated видит username, superuser — всё; settings.value стрипается анониму, default — публичный; secretNotes — только editor/admin.

### Dependencies
- `api-server-toolkit` синхронизирован до **0.26.2** (фикс dot-path criteria в remove — Multi-hop MH10).

## [0.7.8] - 2026-09-30
### Changed (dependency)
- `api-server-toolkit` v0.23.0: boot migrations now run through
  `runMigrationsUnderLock()` (pg advisory xact lock) in `dataSourceFactory` —
  simultaneously booting replicas serialize instead of racing `InitialSchema`
  on a cold database (TypeORM 0.3.x has no built-in migration locking).

## [0.7.7] - 2026-09-30
### Added
- `AccessModule.forRoot()` (toolkit 0.22.0): Access-конфиги (dot-path'и scope, имена полей fields) валидируются против entity-метаданных на старте — опечатка в правиле роняет сервис при загрузке, а не превращается в молча неработающий скоуп.

### Changed
- Toolkit pinned `#v0.22.0` (self-pentest wave 4): `AccessRule.filter` теперь реально компилируется в bind (публичные правила с фильтром, например `isPublished`, работают), scope-all даёт явный bind без allow-байпаса, owner/tenant-бинды без id/tenantId падают с 403 вместо запроса по всей таблице, `remove`/`hardDelete`/`restore` проверяют скоуп для tenant-биндов, `movePosition` не двигает чужие строки, search по dotted-полям больше не расширяет загрузку связей, `getClientIp()`/`TRUST_PROXY` убирают спуфинг `X-Forwarded-For`.

## [0.7.6] - 2026-09-30
### Added
- `AuditModule.forRoot()` (toolkit 0.21.1): successful mutations (non-GET 2xx) are audited as `data.created` / `data.updated` / `data.deleted` and 403s as `access.denied`, published to event-server 0.8.0's tamper-evident `audit_events` store.

### Changed
- Pin: toolkit `#v0.21.1`.

## [0.7.5] - 2026-09-29
### Changed
- Toolkit pinned to v0.20.3 (QueueWorker claim: Postgres forbids FOR UPDATE on the nullable side of an outer join — relations are now hydrated by a second lock-free query inside the claim transaction).

## [0.7.4] - 2026-09-29
### Changed
- Toolkit pinned to v0.20.2 (bootstrap binds 0.0.0.0 by default).

## [0.7.3] - 2026-09-29
### Fixed
- `tsconfig-paths` moved to dependencies: the runner registers it at boot, but the builder's `npm prune --production` removed it as a devDependency, so the image still failed with MODULE_NOT_FOUND.

## [0.7.2] - 2026-09-29
### Fixed
- The image could not boot: `dist/main` requires `@src/*` path aliases that only `tsconfig-paths/register` can resolve at runtime, but the runner stage neither copied `tsconfig.json` nor registered the loader. Runner now matches the other services.

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
