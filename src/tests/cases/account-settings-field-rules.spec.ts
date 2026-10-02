import 'reflect-metadata';
import { removePrivateFields } from 'api-server-toolkit';
import { AccountEntity } from '../../account/account.entity';
// side-effect импорт: EntityController(options) регистрирует field-rules
// (settings.value, posts.secretNotes) в PermissionRegistry при загрузке
// модуля контроллера; неиспользуемый value-импорт TS элиминирует
import '../../db/settings/settings.controller';
import '../../db/posts/posts.controller';
import { SettingsEntity } from '../../db/settings/settings.entity';
import { PostsEntity } from '../../db/posts/posts.entity';

const anonymous = { roles: ['public'] } as any;
const plainUser = { id: 2, roles: [] } as any; // реальный аккаунт → неявно authenticated
const superuser = { id: 3, roles: ['superuser'] } as any;

// removePrivateFields резолвит реестр по dto.constructor — клон должен
// сохранять прототип класса сущности
const cloneOf = (cls: new () => any) => (row: object) =>
  Object.assign(Object.create(cls.prototype), row);
const cloneAccount = cloneOf(AccountEntity);
const cloneSettings = cloneOf(SettingsEntity);
const clonePosts = cloneOf(PostsEntity);

describe('Wave 6 field-rule regressions on real entities', () => {
  it('account: anonymous sees none of password/username/isActivated/isSuperuser', () => {
    const row = {
      id: 1,
      username: 'author@example.com',
      password: '$2a$10$hash',
      isActivated: true,
      isSuperuser: false,
    } as AccountEntity;
    const [view] = removePrivateFields([cloneAccount(row)], anonymous) as any[];
    expect(view.username).toBeUndefined();
    expect(view.password).toBeUndefined();
    expect(view.isActivated).toBeUndefined();
    expect(view.isSuperuser).toBeUndefined();
  });

  it('account: authenticated sees username (author), not privilege flags', () => {
    const row = {
      id: 1,
      username: 'author@example.com',
      password: '$2a$10$hash',
      isActivated: true,
      isSuperuser: false,
    } as AccountEntity;
    const [view] = removePrivateFields([cloneAccount(row)], plainUser) as any[];
    expect(view.username).toBe('author@example.com');
    expect(view.password).toBeUndefined();
    expect(view.isActivated).toBeUndefined();
    expect(view.isSuperuser).toBeUndefined();
  });

  it('account: superuser sees everything', () => {
    const row = {
      id: 1,
      username: 'author@example.com',
      password: '$2a$10$hash',
      isActivated: true,
      isSuperuser: false,
    } as AccountEntity;
    const [view] = removePrivateFields([cloneAccount(row)], superuser) as any[];
    expect(view.username).toBeDefined();
    expect(view.password).toBeDefined();
    expect(view.isActivated).toBeDefined();
    expect(view.isSuperuser).toBeDefined();
  });

  it('settings.value is stripped for anonymous, default stays public', () => {
    // импорт SettingsController зарегистрировал field-rules
    const row = {
      name: 'feature_flag',
      default: 'off',
      value: 'internal-live-value',
    } as SettingsEntity;
    const [anon] = removePrivateFields([cloneSettings(row)], anonymous) as any[];
    expect(anon.value).toBeUndefined();
    expect(anon.default).toBe('off');
    const [auth] = removePrivateFields([cloneSettings(row)], plainUser) as any[];
    expect(auth.value).toBe('internal-live-value');
  });

  it('posts.secretNotes stays editor/admin-only', () => {
    const row = { title: 't', content: 'c', secretNotes: 'private' } as PostsEntity;
    const [anon] = removePrivateFields([clonePosts(row)], anonymous) as any[];
    expect(anon.secretNotes).toBeUndefined();
    const [editorView] = removePrivateFields([clonePosts(row)], {
      id: 4,
      roles: ['editor'],
    } as any) as any[];
    expect(editorView.secretNotes).toBe('private');
  });
});
