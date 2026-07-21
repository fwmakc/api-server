import { createTestModule } from '../app.testingModule';
import { TestProfileService } from '../services';
import { removePrivateFields } from '@core/common';

describe('@FieldAccess — closed entity (profile)', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestProfileService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestProfileService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N7a: admin sees internalNotes', async () => {
    const profiles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    const aliceProfile = profiles.find((p) => +p.id === 1);
    expect(aliceProfile).toBeDefined();
    expect(aliceProfile.internalNotes).toBeDefined();
  });

  it('N7b: non-owner internalNotes stripped', async () => {
    const profiles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(profiles, {
      id: 2,
      name: 'account',
      key: 'id',
      allow: false,
    });
    const aliceProfile = profiles.find((p) => +p.id === 1);
    expect(aliceProfile.internalNotes).toBeUndefined();

    const bobProfile = profiles.find((p) => +p.id === 2);
    expect(bobProfile.internalNotes).toBeDefined();
  });
});