import { createTestModule } from '../app.testingModule';
import { TestNoteService } from '../services';
import { removePrivateFields } from 'api-server-toolkit';

describe('bind — cross-relation ownership (user.id / user.email)', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestNoteService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestNoteService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('find — filter by relation field', () => {
    it('N1: find by user.id returns only alice notes', async () => {
      const result = await service.find(
        {},
        { name: 'user', key: 'id', id: 1, allow: false },
      );
      expect(result.length).toBe(2);
      expect(+result[0].user.id).toBe(1);
    });

    it('N2: find by user.email returns only alice notes', async () => {
      const result = await service.find(
        {},
        { name: 'user', key: 'email', id: 'alice@user', allow: false },
      );
      expect(result.length).toBe(2);
      expect(result[0].user.email).toBe('alice@user');
    });
  });

  describe('create — link by relation field', () => {
    it('N3: create with user.id sets user relation', async () => {
      const result = await service.create(
        { title: 'Via User ID' } as any,
        [{ name: 'user' }],
        { name: 'user', key: 'id', id: 1, allow: false },
      );
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(+result.user.id).toBe(1);
    });

    it('N4: create with user.email looks up and sets user relation', async () => {
      const result = await service.create(
        { title: 'Via User Email' } as any,
        [{ name: 'user' }],
        { name: 'user', key: 'email', id: 'alice@user', allow: false },
      );
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(+result.user.id).toBe(1);
    });
  });

  describe('remove — ownership guard by relation field', () => {
    it('N5: remove bob note as alice (user.id) — false', async () => {
      const result = await service.remove(3, {
        name: 'user',
        key: 'id',
        id: 1,
        allow: false,
      });
      expect(result).toBe(false);
    });

    it('N6: remove bob note as alice (user.email) — false', async () => {
      const result = await service.remove(3, {
        name: 'user',
        key: 'email',
        id: 'alice@user',
        allow: false,
      });
      expect(result).toBe(false);
    });
  });

  describe('scoped find — row-level ownership instead of per-row fields', () => {
    // В новой модели поля видны по ролям (who-only), per-row owner-поля удалены.
    // «Своё vs чужое» на уровне строк решает owner-scope операции read.
    it('N7: user.id — owner-scope find returns only alice notes, role-gated secret stripped', async () => {
      const all = await service.find(
        { relations: [{ name: 'user' }] },
        { allow: true },
      );
      expect(all.length).toBe(5);
      removePrivateFields(all, { id: 1, roles: ['editor'] });
      expect(all.find((n) => +n.id === 1).secret).toBe('alice secret 1');

      const own = await service.find(
        { relations: [{ name: 'user' }] },
        { name: 'user', key: 'id', id: 1, allow: false },
      );
      expect(own.length).toBe(4); // 2 сида + 2 созданы в N3/N4
      expect(own.every((n) => +n.user.id === 1)).toBe(true);
    });

    it('N8: user.email — owner-scope by email returns only alice notes', async () => {
      const own = await service.find(
        { relations: [{ name: 'user' }] },
        { name: 'user', key: 'email', id: 'alice@user', allow: false },
      );
      expect(own.length).toBe(4); // 2 сида + 2 созданы в N3/N4
      expect(own.every((n) => n.user.email === 'alice@user')).toBe(true);

      // editor видит secret, пользователь без ролей — нет (who-only поля).
      const plainView = await service.find(
        { relations: [{ name: 'user' }] },
        { allow: true },
      );
      removePrivateFields(plainView, { id: 2, roles: [] });
      expect(plainView.find((n) => +n.id === 1).secret).toBeUndefined();
    });
  });
});
