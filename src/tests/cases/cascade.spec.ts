import { createTestModule } from '../app.testingModule';
import {
  TestArticleService,
  TestTagService,
  TestCycleAService,
} from '../services';
import {
  TestArticleEntity,
  TestTagEntity,
  TestCommentEntity,
  TestCycleAEntity,
  TestCycleBEntity,
} from '../entities';
import { sanitizeForSave } from '@src/common/service/sanitize.service';
import { PermissionRegistry } from '@src/common/permission.registry';

describe('sanitizeForSave — cascade protection', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;
  let tagService: TestTagService;
  let articleMetadata: any;
  let cycleAService: TestCycleAService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
    tagService = moduleRef.get(TestTagService);
    cycleAService = moduleRef.get(TestCycleAService);
    articleMetadata = (articleService as any).repository.metadata;
  });

  afterAll(async () => {
    PermissionRegistry.delete(TestTagEntity);
    PermissionRegistry.delete(TestCommentEntity);
    await moduleRef.close();
  });

  describe('unit — direct sanitizeForSave calls', () => {
    it('C1: existing entity in relation stripped to { id }', () => {
      const entity = {
        title: 'Test',
        account: { id: 2, username: 'hacker', password: 'stolen' },
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.account).toEqual({ id: 2 });
      expect((entity.account as any).username).toBeUndefined();
      expect((entity.account as any).password).toBeUndefined();
    });

    it('C2: new entity not in registry → stripped (null → deleted)', () => {
      const entity = {
        title: 'Test',
        account: { username: 'newuser', password: '123' },
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.account).toBeUndefined();
    });

    it('C3: new entity in registry, create: public → kept', () => {
      PermissionRegistry.set(TestTagEntity, {
        create: 'public',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      const entity = {
        title: 'Test',
        tags: [{ name: 'new-tag' }, { id: 1, name: 'should-strip' }],
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.tags).toHaveLength(2);
      expect(entity.tags[0]).toEqual({ name: 'new-tag' });
      expect(entity.tags[1]).toEqual({ id: 1 });
    });

    it('C4: new entity in registry, create: admin → stripped for non-admin', () => {
      PermissionRegistry.set(TestTagEntity, {
        create: 'admin',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      const entity = {
        title: 'Test',
        tags: [{ name: 'new-tag' }, { id: 1 }],
      };
      sanitizeForSave(entity, articleMetadata, {
        id: 1,
        name: 'account',
        allow: false,
      });
      expect(entity.tags).toHaveLength(1);
      expect(entity.tags[0]).toEqual({ id: 1 });
    });

    it('C5: new entity in registry, create: admin → kept for admin', () => {
      PermissionRegistry.set(TestTagEntity, {
        create: 'admin',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      const entity = {
        title: 'Test',
        tags: [{ name: 'admin-tag' }],
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.tags).toHaveLength(1);
      expect(entity.tags[0]).toEqual({ name: 'admin-tag' });
    });

    it('C6: new entity in registry, create: closed → always stripped', () => {
      PermissionRegistry.set(TestTagEntity, {
        create: 'closed',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      const entity = {
        title: 'Test',
        tags: [{ name: 'new-tag' }, { id: 1 }],
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.tags).toHaveLength(1);
      expect(entity.tags[0]).toEqual({ id: 1 });
    });

    it('C7: array of mixed items filtered correctly', () => {
      PermissionRegistry.set(TestTagEntity, {
        create: 'public',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      const entity = {
        title: 'Test',
        tags: [
          { id: 1, name: 'strip-me' },
          { name: 'keep-me' },
          { id: 2 },
          null,
          { name: 'also-keep' },
        ],
      };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity.tags).toHaveLength(4);
      expect(entity.tags[0]).toEqual({ id: 1 });
      expect(entity.tags[1]).toEqual({ name: 'keep-me' });
      expect(entity.tags[2]).toEqual({ id: 2 });
      expect(entity.tags[3]).toEqual({ name: 'also-keep' });
    });

    it('C8: no relations in entity → no change', () => {
      const entity = { title: 'Simple', content: 'No relations' };
      sanitizeForSave(entity, articleMetadata, { allow: true });
      expect(entity).toEqual({ title: 'Simple', content: 'No relations' });
    });
  });

  describe('integration — via service.create()', () => {
    it('C9: create strips nested new entities not in registry', async () => {
      PermissionRegistry.delete(TestTagEntity);

      const result = await articleService.create(
        {
          title: 'Cascade Test',
          tags: [{ name: 'should-not-exist' }],
        } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false },
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Cascade Test');

      const allTags = await tagService.find();
      const newTag = allTags.find((t: any) => t.name === 'should-not-exist');
      expect(newTag).toBeUndefined();
    });

    it('C10: create with existing tag id → tag linked', async () => {
      const result = await articleService.create(
        {
          title: 'Tag Link Test',
          tags: [{ id: 1 }],
        } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false },
      );

      expect(result).toBeDefined();

      const withTags = await articleService.findOne({
        id: result.id,
        relations: [{ name: 'tags' }],
      });
      expect(withTags.tags).toBeDefined();
      expect(withTags.tags.length).toBe(1);
      expect(+withTags.tags[0].id).toBe(1);
    });
  });

  describe('circular references', () => {
    it('C11: circular reference does not cause infinite loop', () => {
      const cycleAMetadata = (cycleAService as any).repository.metadata;

      const a: any = { id: 1, name: 'A', secretA: 'secret' };
      const b: any = { id: 2, name: 'B', secretB: 'secret' };
      a.b = b;
      b.a = a;

      sanitizeForSave(a, cycleAMetadata, { allow: true });

      expect(a.b).toEqual({ id: 2 });
    });
  });
});
