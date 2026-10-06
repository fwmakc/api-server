# AI Context — api-server

> Auto-generated. Run `npm run ai-context` to regenerate.
> Generated: 2026-10-06T08:43:17.769Z

---

## Controllers

### PostsController

Base path: `/posts`

| Method | Path |
|--------|------|
| `GET` | `/posts/find` |
| `GET` | `/posts/find/first` |
| `GET` | `/posts/find/many/:ids` |
| `GET` | `/posts/find/:id` |
| `GET` | `/posts/count` |
| `GET` | `/posts/self` |
| `POST` | `/posts/create` |
| `PATCH` | `/posts/update/:id` |
| `POST` | `/posts/position/sort` |
| `POST` | `/posts/position/move/:id` |
| `DELETE` | `/posts/remove/:id` |

### PostsCategoriesController

Base path: `/posts/categories`

| Method | Path |
|--------|------|
| `GET` | `/posts/categories/find` |
| `GET` | `/posts/categories/find/first` |
| `GET` | `/posts/categories/find/many/:ids` |
| `GET` | `/posts/categories/find/:id` |
| `GET` | `/posts/categories/count` |
| `GET` | `/posts/categories/self` |
| `POST` | `/posts/categories/create` |
| `PATCH` | `/posts/categories/update/:id` |
| `POST` | `/posts/categories/position/sort` |
| `POST` | `/posts/categories/position/move/:id` |
| `DELETE` | `/posts/categories/remove/:id` |

### PostsTagsController

Base path: `/posts/tags`

| Method | Path |
|--------|------|
| `GET` | `/posts/tags/find` |
| `GET` | `/posts/tags/find/first` |
| `GET` | `/posts/tags/find/many/:ids` |
| `GET` | `/posts/tags/find/:id` |
| `GET` | `/posts/tags/count` |
| `GET` | `/posts/tags/self` |
| `POST` | `/posts/tags/create` |
| `PATCH` | `/posts/tags/update/:id` |
| `POST` | `/posts/tags/position/sort` |
| `POST` | `/posts/tags/position/move/:id` |
| `DELETE` | `/posts/tags/remove/:id` |

### SettingsController

Base path: `/settings`

| Method | Path |
|--------|------|
| `GET` | `/settings/find` |
| `GET` | `/settings/find/first` |
| `GET` | `/settings/find/many/:ids` |
| `GET` | `/settings/find/:id` |
| `GET` | `/settings/count` |
| `GET` | `/settings/self` |
| `POST` | `/settings/create` |
| `PATCH` | `/settings/update/:id` |
| `POST` | `/settings/position/sort` |
| `POST` | `/settings/position/move/:id` |
| `DELETE` | `/settings/remove/:id` |

### SettingsGroupsController

Base path: `/settings/groups`

| Method | Path |
|--------|------|
| `GET` | `/settings/groups/find` |
| `GET` | `/settings/groups/find/first` |
| `GET` | `/settings/groups/find/many/:ids` |
| `GET` | `/settings/groups/find/:id` |
| `GET` | `/settings/groups/count` |
| `GET` | `/settings/groups/self` |
| `POST` | `/settings/groups/create` |
| `PATCH` | `/settings/groups/update/:id` |
| `POST` | `/settings/groups/position/sort` |
| `POST` | `/settings/groups/position/move/:id` |
| `DELETE` | `/settings/groups/remove/:id` |

### WebhooksController

Base path: `/webhooks`

| Method | Path |
|--------|------|
| `POST` | `/webhooks/events` |

---

## Services

### SubscriberService

- `onApplicationBootstrap(): Promise<void>`
- `register(retry = 0): Promise<void>`
- `httpPost(`${this.eventServerUrl}/subscribe`,
        {
          service: "api-server",
          url: this.webhookUrl,
          patterns: this.patterns,
          active: true,
          // Регистрация идемпотентна (тот же service+url мержится): свежий
          // секрет перепрописывает сохранённый, например после ротации.
          ...(this.webhookSecret ?`

### WebhooksService

- `handleEvent(event: WebhookEnvelopeDto): Promise<void>`
- `onRegistered(em: EntityManager,
    payload: UserRegisteredDto,): Promise<void>`
- `onConfirmed(em: EntityManager,
    payload: UserConfirmedDto,): Promise<void>`
- `onDeactivated(em: EntityManager,
    payload: UserDeactivatedDto,): Promise<void>`
- `onDeleted(em: EntityManager,
    payload: UserDeletedDto,): Promise<void>`

---

## Entities

### AccountEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `username` | `string` |
| `password` | `string` |
| `isActivated` | `boolean` |
| `isSuperuser` | `boolean` |


### PostsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `title` | `string` |
| `content` | `string` |
| `publishedAt` | `Date` |
| `isPublished` | `boolean` |
| `secretNotes` | `string` |

Relations: `AccountEntity`, `PostsCategoriesEntity`, `PostsTagsEntity`


### PostsCategoriesEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `title` | `string` |

Relations: `PostsEntity`


### PostsTagsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `title` | `string` |

Relations: `PostsEntity`


### SettingsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `name` | `string` |
| `description` | `string` |
| `type` | `TypeValues` |
| `position` | `string` |
| `default` | `string` |
| `value` | `string` |
| `isDisabled` | `boolean` |

Relations: `SettingsGroupsEntity`


### SettingsGroupsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `name` | `string` |
| `description` | `string` |
| `position` | `string` |
| `isDisabled` | `boolean` |

Relations: `SettingsEntity`


### ProcessedEventEntity (table: `webhook_processed_events`)


---

## DTOs

### AccountDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `username` | `string` | yes |
| `password` | `string` | yes |
| `isActivated` | `boolean` | yes |
| `isSuperuser` | `boolean` | yes |

### PostsDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `title` | `string` | no |
| `content` | `string` | no |
| `publishedAt` | `Date` | no |
| `isPublished` | `boolean` | no |
| `secretNotes` | `string` | no |
| `category` | `PostsCategoriesDto` | yes |
| `tags` | `PostsTagsDto[]` | yes |

### PostsCategoriesDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `title` | `string` | yes |
| `posts` | `PostsDto[]` | yes |

### PostsTagsDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `title` | `string` | yes |
| `posts` | `PostsDto[]` | yes |

### SettingsDto

| Field | Type | Optional |
|-------|------|----------|
| `name` | `string` | yes |
| `description` | `string` | yes |
| `type` | `TypeValues` | yes |
| `position` | `number` | yes |
| `default` | `string` | yes |
| `value` | `string` | yes |
| `isDisabled` | `boolean` | yes |
| `group` | `SettingsGroupsDto` | yes |

### SettingsGroupsDto

| Field | Type | Optional |
|-------|------|----------|
| `name` | `string` | yes |
| `description` | `string` | yes |
| `position` | `number` | yes |
| `isDisabled` | `boolean` | yes |
| `settings` | `SettingsDto[]` | yes |
