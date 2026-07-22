import { createTestModule } from '../app.testingModule';
import { TestSecretService } from '../services';
import { removePrivateFields, stripWriteFields } from 'api-server-toolkit';
import {
  TestSecretEntity,
  TestArticleEntity,
  TestCommentEntity,
  TestAccountEntity,
} from '../entities';

describe('@FieldAccess — field-level access control', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestSecretService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestSecretService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('read access', () => {
    it('FA1: admin sees adminCode field', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      const alice = result.find((s) => +s.id === 1);
      expect(alice.adminCode).toBeDefined();
      expect(alice.adminCode).toBe('AC-001');
    });

    it('FA2: non-owner cannot see adminCode field', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(result, {
        id: 1,
        name: 'account',
        key: 'id',
        allow: false,
      });
      const alice = result.find((s) => +s.id === 1);
      expect(alice.adminCode).toBeUndefined();
    });

    it('FA3: hiddenField never visible (read: closed)', async () => {
      const result = await service.find({}, { allow: true });
      removePrivateFields(result, { allow: true });
      result.forEach((s) => {
        expect(s.hiddenField).toBeUndefined();
      });
    });

    it('FA8: admin sees adminCode after removePrivateFields with admin bind', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(result, { allow: true });
      const alice = result.find((s) => +s.id === 1);
      expect(alice.adminCode).toBeDefined();
      expect(alice.adminCode).toBe('AC-001');
    });

    it('FA9: anonymous bind strips all non-public read fields', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(result, { id: undefined, name: 'account', key: 'id', allow: false });
      result.forEach((s) => {
        expect(s.adminCode).toBeUndefined();
        expect(s.hiddenField).toBeUndefined();
      });
    });
  });

  describe('write access', () => {
    it('FA4: admin can write adminPrice (write: admin)', async () => {
      const result = await service.update(
        1,
        { adminPrice: 500 } as any,
        undefined,
        { allow: true },
      );
      expect(result).toBeDefined();
      expect(+result.adminPrice).toBe(500);
    });

    it('FA5: non-admin cannot write adminPrice (write: admin)', async () => {
      const result = await service.update(
        1,
        { adminPrice: 999, name: 'Updated by owner' } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false },
      );
      expect(result).toBeDefined();
      expect(+result.adminPrice).toBe(500);
      expect(result.name).toBe('Updated by owner');
    });

    it('FA6: lockedField never writable (write: closed)', async () => {
      const result = await service.update(
        1,
        { lockedField: 'hacked', name: 'Attempt lock' } as any,
        undefined,
        { allow: true },
      );
      expect(result).toBeDefined();
      expect(result.lockedField).not.toBe('hacked');
    });

    it('FA7: non-admin create strips adminPrice and lockedField', async () => {
      const result = await service.create(
        {
          name: 'New Secret',
          adminPrice: 777,
          lockedField: 'injected',
        } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false },
      );
      expect(result).toBeDefined();
      expect(result.name).toBe('New Secret');
      expect(result.adminPrice).not.toBe(777);
      expect(result.lockedField).not.toBe('injected');
    });

    it('FA10: admin create strips lockedField (write: closed)', async () => {
      const result = await service.create(
        {
          name: 'Admin Secret',
          adminPrice: 100,
          lockedField: 'admin-injected',
        } as any,
        undefined,
        { allow: true },
      );
      expect(result).toBeDefined();
      expect(result.name).toBe('Admin Secret');
      expect(+result.adminPrice).toBe(100);
      expect(result.lockedField).not.toBe('admin-injected');
    });
  });

  describe('account-level access (read: account / write: account)', () => {
    it('FA12: logged-in user sees accountNote (read: account)', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(result, { id: 1, name: 'account', key: 'id', allow: false });
      const alice = result.find((s) => +s.id === 1);
      expect(alice.accountNote).toBe('visible to logged-in users');
    });

    it('FA13: anonymous cannot see accountNote (read: account)', async () => {
      const result = await service.find(
        { relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(result, { id: undefined, name: 'account', key: 'id', allow: false });
      result.forEach((s) => {
        expect(s.accountNote).toBeUndefined();
      });
    });

    it('FA14: logged-in user can write accountWrite (write: account)', async () => {
      const result = await service.update(
        1,
        { accountWrite: 'updated by logged-in' } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false },
      );
      expect(result.accountWrite).toBe('updated by logged-in');
    });

    it('FA15: anonymous cannot write accountWrite (write: account)', async () => {
      const dto: any = { accountWrite: 'anonymous inject' };
      stripWriteFields(dto, TestSecretEntity, null);
      expect(dto.accountWrite).toBeUndefined();
    });
  });

  describe('stripWriteFields — unit (null bind = anonymous)', () => {
    it('FA11: null bind strips all non-public write fields', () => {
      const dto: any = {
        name: 'Test',
        adminPrice: 999,
        lockedField: 'locked',
      };
      stripWriteFields(dto, TestSecretEntity, null);
      expect(dto.name).toBe('Test');
      expect(dto.adminPrice).toBeUndefined();
      expect(dto.lockedField).toBeUndefined();
    });

    it('FA16: null bind strips write: owner fields on TestArticleEntity', () => {
      const dto: any = {
        title: 'Hello',
        secretNotes: 'private',
        adminNotes: 'admin only',
        lockedNotes: 'locked',
      };
      stripWriteFields(dto, TestArticleEntity, null);
      expect(dto.title).toBe('Hello');
      expect(dto.secretNotes).toBeUndefined();
      expect(dto.adminNotes).toBeUndefined();
      expect(dto.lockedNotes).toBeUndefined();
    });

    it('FA17: owner bind allows write: owner field but strips admin/closed', () => {
      const dto: any = {
        title: 'Hello',
        secretNotes: 'my notes',
        adminNotes: 'try admin',
        lockedNotes: 'try locked',
      };
      stripWriteFields(dto, TestArticleEntity, { id: 1, name: 'account', key: 'id', allow: false });
      expect(dto.title).toBe('Hello');
      expect(dto.secretNotes).toBe('my notes');
      expect(dto.adminNotes).toBeUndefined();
      expect(dto.lockedNotes).toBeUndefined();
    });
  });

  describe('accountId fallback — ownership via FK when relation not loaded', () => {
    it('FA18: canRead uses accountId fallback when account relation is absent', () => {
      const own = new TestArticleEntity();
      own.id = 10;
      own.title = 'Own';
      own.secretNotes = 'visible via FK';
      (own as any).accountId = 1;

      removePrivateFields(own, { id: 1, name: 'account', key: 'id', allow: false });
      expect(own.secretNotes).toBe('visible via FK');

      const other = new TestArticleEntity();
      other.id = 11;
      other.title = 'Other';
      other.secretNotes = 'should be stripped';
      (other as any).accountId = 2;

      removePrivateFields(other, { id: 1, name: 'account', key: 'id', allow: false });
      expect(other.secretNotes).toBeUndefined();
    });
  });

  describe('computeNestedBind with dot-path — multi-hop ownership', () => {
    it('FA19: nested fields visible through article.account chain (owner)', () => {
      const alice = new TestAccountEntity();
      alice.id = 1;
      alice.email = 'alice@test.com';

      const article = new TestArticleEntity();
      article.id = 1;
      article.title = 'Article';
      article.secretNotes = 'article secret';
      article.account = alice;

      const comment = new TestCommentEntity();
      comment.id = 1;
      comment.text = 'Alice comment';
      comment.authorIp = '127.0.0.1';
      comment.article = article;

      removePrivateFields(comment, { id: 1, name: 'article.account', key: 'id', allow: false });

      expect(comment.authorIp).toBe('127.0.0.1');
      expect(comment.article.secretNotes).toBe('article secret');
      expect(comment.article.account.email).toBe('alice@test.com');
    });

    it('FA20: nested fields stripped through article.account chain (non-owner)', () => {
      const bob = new TestAccountEntity();
      bob.id = 2;
      bob.email = 'bob@test.com';

      const article = new TestArticleEntity();
      article.id = 3;
      article.title = 'Bob Article';
      article.secretNotes = 'bob secret';
      article.account = bob;

      const comment = new TestCommentEntity();
      comment.id = 2;
      comment.text = 'Bob comment';
      comment.authorIp = '192.168.1.1';
      comment.article = article;

      removePrivateFields(comment, { id: 1, name: 'article.account', key: 'id', allow: false });

      expect(comment.authorIp).toBeUndefined();
      expect(comment.article.secretNotes).toBeUndefined();
      expect(comment.article.account.email).toBeUndefined();
    });
  });
});