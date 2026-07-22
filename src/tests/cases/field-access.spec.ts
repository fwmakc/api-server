import { createTestModule } from '../app.testingModule';
import { TestSecretService } from '../services';
import { removePrivateFields, stripWriteFields } from 'api-server-toolkit';
import { TestSecretEntity } from '../entities';

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
  });
});