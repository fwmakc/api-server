import { ForbiddenException } from '@nestjs/common';
import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { TestArticleDto } from '../dtos';
import { TestArticleEntity } from '../entities';
import { PrivateController } from '@src/common/controller/private.controller';
import { ClosedController } from '@src/common/controller/closed.controller';
import { CommonController } from '@src/common/common.controller';

describe('Controllers — PrivateController, ClosedController, CommonController', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('PrivateController — bind on reads + self endpoint', () => {
    let controller: any;

    beforeAll(() => {
      const CtrlClass = PrivateController(
        'test_articles',
        TestArticleDto,
        TestArticleEntity,
        'auth',
      );
      controller = new CtrlClass();
      controller.service = articleService;
    });

    it('CC1: self returns only own articles (bind allow=false)', async () => {
      const result = await controller.self(
        undefined,
        {},
        undefined,
        undefined,
        { id: 1, isSuperuser: false } as any,
      );
      expect(result.length).toBe(2);
      expect(result.every((r: any) => +r.auth.id === 1)).toBe(true);
    });

    it('CC2: self for bob returns only bob articles', async () => {
      const result = await controller.self(
        undefined,
        {},
        undefined,
        undefined,
        { id: 2, isSuperuser: false } as any,
      );
      expect(result.length).toBe(1);
      expect(+result[0].id).toBe(3);
    });

    it('CC3: find with bind — non-superuser sees only own', async () => {
      const result = await controller.find(
        undefined,
        undefined,
        undefined,
        { id: 'ASC' },
        undefined,
        undefined,
        undefined,
        { id: 2, isSuperuser: false } as any,
      );
      expect(result.length).toBe(1);
      expect(+result[0].auth.id).toBe(2);
    });

    it('CC4: find with bind — superuser sees all', async () => {
      const result = await controller.find(
        undefined,
        undefined,
        undefined,
        { id: 'ASC' },
        undefined,
        undefined,
        undefined,
        { id: 3, isSuperuser: true } as any,
      );
      expect(result.length).toBe(3);
    });

    it('CC5: findOne with bind — owner can find own', async () => {
      const result = await controller.findOne(
        1,
        undefined,
        [{ name: 'auth' }],
        { id: 1, isSuperuser: false } as any,
      );
      expect(result).toBeDefined();
      expect(+result.id).toBe(1);
    });

    it('CC6: findOne with bind — non-owner gets NotFoundException', async () => {
      await expect(
        controller.findOne(
          1,
          undefined,
          [{ name: 'auth' }],
          { id: 2, isSuperuser: false } as any,
        ),
      ).rejects.toThrow('Entrie not found');
    });

    it('CC7: count with bind — non-superuser counts own only', async () => {
      const result = await controller.count(
        undefined,
        undefined,
        undefined,
        undefined,
        { id: 1, isSuperuser: false } as any,
      );
      expect(result).toBe(2);
    });

    it('CC8: self shows private fields for owner', async () => {
      const result = await controller.self(
        undefined,
        {},
        undefined,
        [{ name: 'auth' }],
        { id: 2, isSuperuser: false } as any,
      );
      for (const article of result) {
        expect(article.secretNotes).toBeDefined();
      }
    });

    it('CC9: private fields visible for owner in self', async () => {
      const result = await controller.self(
        undefined,
        {},
        undefined,
        [{ name: 'auth' }],
        { id: 1, isSuperuser: false } as any,
      );
      for (const article of result) {
        expect(article.secretNotes).toBeDefined();
      }
    });
  });

  describe('ClosedController — superuser-only access', () => {
    let controller: any;

    beforeAll(() => {
      const CtrlClass = ClosedController(
        'test_articles',
        TestArticleDto,
        TestArticleEntity,
      );
      controller = new CtrlClass();
      controller.service = articleService;
    });

    it('CC10: create by non-superuser throws ForbiddenException', async () => {
      await expect(
        controller.create(
          { title: 'Forbidden' } as any,
          undefined,
          { id: 1, isSuperuser: false } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CC11: update by non-superuser throws ForbiddenException', async () => {
      await expect(
        controller.update(
          1,
          { title: 'Hack' } as any,
          undefined,
          { id: 1, isSuperuser: false } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CC12: remove by non-superuser throws ForbiddenException', async () => {
      await expect(
        controller.remove(1, { id: 1, isSuperuser: false } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CC13: create by superuser succeeds', async () => {
      const result = await controller.create(
        { title: 'Admin Created' } as any,
        undefined,
        { id: 3, isSuperuser: true } as any,
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('Admin Created');
    });

    it('CC14: update by superuser succeeds', async () => {
      const result = await controller.update(
        1,
        { title: 'Admin Updated' } as any,
        undefined,
        { id: 3, isSuperuser: true } as any,
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('Admin Updated');
    });

    it('CC15: sortPosition by non-superuser throws', async () => {
      await expect(
        controller.sortPosition(
          'position',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { id: 1, isSuperuser: false } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CC16: movePosition by non-superuser throws', async () => {
      await expect(
        controller.movePosition(
          1,
          'position',
          2,
          { id: 1, isSuperuser: false } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CommonController — open access (no auth required)', () => {
    let controller: any;

    beforeAll(() => {
      const CtrlClass = CommonController(
        'test_articles',
        TestArticleDto,
        TestArticleEntity,
      );
      controller = new CtrlClass();
      controller.service = articleService;
    });

    it('CC17: find returns all without auth', async () => {
      const result = await controller.find(
        undefined,
        undefined,
        undefined,
        { id: 'ASC' },
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('CC18: findOne returns entity without auth', async () => {
      const result = await controller.findOne(
        1,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toBeDefined();
      expect(+result.id).toBe(1);
    });

    it('CC19: count returns total without auth', async () => {
      const result = await controller.count(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toBeGreaterThanOrEqual(3);
    });

    it('CC20: create works without auth (open)', async () => {
      const result = await controller.create(
        { title: 'Open Create' } as any,
        undefined,
        undefined,
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('Open Create');
    });

    it('CC21: update works without auth (open)', async () => {
      const result = await controller.update(
        1,
        { title: 'Open Update' } as any,
        undefined,
        undefined,
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('Open Update');
    });
  });
});
