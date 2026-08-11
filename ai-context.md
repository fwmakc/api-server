# AI Context — api-server

> Auto-generated. Run `npm run ai-context` to regenerate.
> Generated: 2026-08-11T20:05:19.766Z

---

## Controllers

### PostsController

Base path: `/posts`

| Method | Path |
|--------|------|

### PostsCategoriesController

Base path: `/posts/categories`

| Method | Path |
|--------|------|

### PostsTagsController

Base path: `/posts/tags`

| Method | Path |
|--------|------|

### SettingsController

Base path: `/settings`

| Method | Path |
|--------|------|

### SettingsGroupsController

Base path: `/settings/groups`

| Method | Path |
|--------|------|

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
