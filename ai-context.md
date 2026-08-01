# AI Context — api-server

> Auto-generated. Run `npm run ai-context` to regenerate.
> Generated: 2026-08-01T21:10:11.049Z

---

## Controllers

### PersonsController

Base path: `/persons`

| Method | Path |
|--------|------|

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

## Services

### AppService

- `hello(): string`

### AuthClientService

- `getAccountInfo(id: number): Promise<AccountInfo | null>`

### ClientsService extends `CommonService`

- `clientsVerify(client_id: string, client_secret: string): Promise<any>`
- `clientsGetWhere(where: object,
    relations: Array<RelationsDto> = undefined,): Promise<ClientsEntity>`

### PersonsService extends `CommonService`

- `login(persons: PersonsDto): Promise<PersonsEntity>`
- `create(persons: PersonsDto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto,): Promise<PersonsEntity>`

### RandomService

- `keys(sets): name.replace(/\W+/giu, ' ').split(' ')`
- `randomOption(endings): ''`

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


### ClientsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `client_id` | `string` |
| `client_secret` | `string` |
| `client_password` | `string` |
| `client_type` | `TypeClients` |
| `title` | `string` |
| `description` | `string` |
| `client_uri` | `string` |
| `code` | `string` |
| `publishedAt` | `Date` |
| `isPublished` | `boolean` |

Relations: `AccountEntity`


### PersonsEntity

| Column | Type |
|--------|------|
| `id` | `number` |
| `createdAt` | `Date` |
| `updatedAt` | `Date` |
| `username` | `string` |
| `password` | `string` |
| `email` | `string` |
| `phone` | `string` |
| `name` | `string` |
| `lastName` | `string` |
| `parentName` | `string` |
| `avatar` | `string` |
| `birthday` | `Date` |
| `locale` | `string` |
| `address` | `string` |
| `timezone` | `string` |
| `gender` | `TypeGenders` |

Relations: `AccountEntity`


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
| `viewCount` | `number` |

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

### ClientsDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `client_id` | `string` | yes |
| `client_secret` | `string` | yes |
| `client_password` | `string` | yes |
| `client_type` | `TypeClients` | yes |
| `title` | `string` | yes |
| `description` | `string` | yes |
| `client_uri` | `string` | yes |
| `code` | `string` | yes |
| `publishedAt` | `Date` | yes |
| `isPublished` | `boolean` | yes |
| `redirect_uri` | `string` | yes |

### PersonsDto

| Field | Type | Optional |
|-------|------|----------|
| `createdAt` | `Date` | yes |
| `updatedAt` | `Date` | yes |
| `username` | `string` | yes |
| `password` | `string` | yes |
| `email` | `string` | yes |
| `phone` | `string` | yes |
| `name` | `string` | yes |
| `lastName` | `string` | yes |
| `parentName` | `string` | yes |
| `avatar` | `string` | yes |
| `birthday` | `Date` | yes |
| `locale` | `string` | yes |
| `address` | `string` | yes |
| `timezone` | `string` | yes |
| `gender` | `TypeGenders` | yes |

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
| `viewCount` | `number` | no |
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
