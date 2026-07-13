import { createTestModule } from '../app.testingModule';
import { TestNoteService } from '../services';
import { removePrivateFields } from '@src/common/service/private_fields.service';

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
      const result = await service.remove(
        3,
        { name: 'user', key: 'id', id: 1, allow: false },
      );
      expect(result).toBe(false);
    });

    it('N6: remove bob note as alice (user.email) — false', async () => {
      const result = await service.remove(
        3,
        { name: 'user', key: 'email', id: 'alice@user', allow: false },
      );
      expect(result).toBe(false);
    });
  });

  describe('removePrivateFields — visibility by relation field', () => {
    it('N7: user.id — alice sees own secret, bob secret stripped', async () => {
      const all = await service.find(
        { relations: [{ name: 'user' }] },
        { allow: true },
      );
      expect(all.length).toBe(5);

      removePrivateFields(all, {
        name: 'user',
        key: 'id',
        id: 1,
        allow: false,
      });

      const aliceNote = all.find((n) => +n.id === 1);
      const bobNote = all.find((n) => +n.id === 3);

      expect(aliceNote.secret).toBe('alice secret 1');
      expect(bobNote.secret).toBeUndefined();
    });

    it('N8: user.email — alice sees own secret, bob secret stripped', async () => {
      const all = await service.find(
        { relations: [{ name: 'user' }] },
        { allow: true },
      );

      removePrivateFields(all, {
        name: 'user',
        key: 'email',
        id: 'alice@user',
        allow: false,
      });

      const aliceNote = all.find((n) => +n.id === 1);
      const bobNote = all.find((n) => +n.id === 3);

      expect(aliceNote.secret).toBe('alice secret 1');
      expect(bobNote.secret).toBeUndefined();
    });
  });
});
