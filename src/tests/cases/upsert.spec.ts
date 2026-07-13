import { createTestModule } from '../app.testingModule';
import { TestUserService } from '../services';

describe('upsert — find by unique or create', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestUserService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestUserService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('U37: getUniqueColumns returns email', () => {
    const uniques = service.getUniqueColumns();
    expect(uniques).toContain('email');
  });

  it('U38: findUniqueEntrie finds existing by email', async () => {
    const result = await service.findUniqueEntrie({ email: 'alice@user' });
    expect(result).toBeDefined();
    expect(+result.id).toBe(1);
  });

  it('U39: findUniqueEntrie returns null for non-existing email', async () => {
    const result = await service.findUniqueEntrie({ email: 'nobody@user' });
    expect(result).toBeNull();
  });

  it('U40: upsert creates when no unique match', async () => {
    const result = await service.upsert({
      email: 'charlie@user',
      name: 'Charlie',
    } as any);
    expect(result).toBeDefined();
    expect(+result.id).toBeGreaterThan(2);
    expect(result.name).toBe('Charlie');
  });

  it('U41: upsert updates when unique match found', async () => {
    const result = await service.upsert({
      email: 'alice@user',
      name: 'Alice Updated',
    } as any);
    expect(result).toBeDefined();
    expect(+result.id).toBe(1);
    expect(result.name).toBe('Alice Updated');
  });

  it('U42: upsert ignores id in dto', async () => {
    const result = await service.upsert({
      id: 999,
      email: 'alice@user',
      name: 'Alice Again',
    } as any);
    expect(+result.id).toBe(1);
    expect(result.name).toBe('Alice Again');
  });
});
