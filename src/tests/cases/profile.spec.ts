import { createTestModule } from '../app.testingModule';
import { TestProfileService } from '../services';
import { removePrivateFields } from 'api-server-toolkit';

describe('Field rules — profile internalNotes', () => {
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

  it('N7b: editor sees internalNotes on all profiles', async () => {
    const profiles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(profiles, { id: 2, roles: ['editor'] });
    const aliceProfile = profiles.find((p) => +p.id === 1);
    expect(aliceProfile.internalNotes).toBeDefined();

    const bobProfile = profiles.find((p) => +p.id === 2);
    expect(bobProfile.internalNotes).toBeDefined();
  });

  it('N7c: user without roles has internalNotes stripped', async () => {
    const profiles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(profiles, { id: 2, roles: [] });
    profiles.forEach((p) => {
      expect(p.internalNotes).toBeUndefined();
    });
  });
});