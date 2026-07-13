import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('Find methods — findFirst, findMany, search', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('findFirst()', () => {
    it('F1: returns first entity by default order', async () => {
      const result = await service.findFirst({});
      expect(result).toBeDefined();
      expect(+result.id).toBe(1);
    });

    it('F2: returns first entity with DESC order', async () => {
      const result = await service.findFirst({ order: { id: 'DESC' } });
      expect(result).toBeDefined();
      expect(+result.id).toBe(3);
    });

    it('F3: returns first entity matching where filter', async () => {
      const result = await service.findFirst({
        where: { auth: { id: 2 } },
        relations: [{ name: 'auth' }],
      });
      expect(result).toBeDefined();
      expect(result.title).toBe('Bob Post');
    });

    it('F4: returns undefined when no match', async () => {
      const result = await service.findFirst({
        where: { title: 'Nonexistent' },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findMany()', () => {
    it('F5: returns entities by array of IDs', async () => {
      const result = await service.findMany({ ids: [1, 3] });
      expect(result.length).toBe(2);
      expect(+result[0].id).toBe(1);
      expect(+result[1].id).toBe(3);
    });

    it('F6: returns empty for non-existent IDs', async () => {
      const result = await service.findMany({ ids: [999, 998] });
      expect(result.length).toBe(0);
    });

    it('F7: returns partial match when some IDs exist', async () => {
      const result = await service.findMany({ ids: [1, 999] });
      expect(result.length).toBe(1);
      expect(+result[0].id).toBe(1);
    });

    it('F8: returns all when all IDs exist', async () => {
      const result = await service.findMany({ ids: [1, 2, 3] });
      expect(result.length).toBe(3);
    });

    it('F9: accepts string IDs', async () => {
      const result = await service.findMany({ ids: ['1', '2'] });
      expect(result.length).toBe(2);
    });
  });

  describe('search', () => {
    it('F10: search single field, single term (default AND)', async () => {
      const result = await service.find({
        search: {
          fields: ['title'],
          terms: ['alice'],
        },
      });
      expect(result.length).toBe(2);
      expect(result.every((r) => r.title.includes('Alice'))).toBe(true);
    });

    it('F11: search multiple fields', async () => {
      const result = await service.find({
        search: {
          fields: ['title', 'content'],
          terms: ['content'],
        },
      });
      expect(result.length).toBe(3);
    });

    it('F12: search with AND method — all terms must match', async () => {
      const result = await service.find({
        search: {
          fields: ['title'],
          terms: ['alice', 'post', '1'],
          method: 'and',
        },
      });
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Alice Post 1');
    });

    it('F13: search with OR method — any term matches', async () => {
      const result = await service.find({
        search: {
          fields: ['title'],
          terms: ['bob', '1'],
          method: 'or',
        },
      });
      expect(result.length).toBe(2);
    });

    it('F14: search with no matches returns empty', async () => {
      const result = await service.find({
        search: {
          fields: ['title'],
          terms: ['nonexistent_xyz'],
        },
      });
      expect(result.length).toBe(0);
    });

    it('F15: search with dot-path nested field', async () => {
      const result = await service.find({
        relations: [{ name: 'auth' }],
        search: {
          fields: ['auth.username'],
          terms: ['alice'],
        },
      });
      expect(result.length).toBe(2);
      expect(result.every((r) => r.auth.username.includes('alice'))).toBe(true);
    });
  });
});
