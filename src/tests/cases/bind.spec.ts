import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('bind — ownership mechanism', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P11: find with bind returns only owner articles', async () => {
    const result = await service.find(
      {},
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(result.length).toBe(2);
  });

  it('P12: find with allow=true (no id) returns all articles', async () => {
    const result = await service.find({}, { allow: true });
    expect(result.length).toBe(3);
  });

  it('P13: find with bob bind returns only bob article', async () => {
    const result = await service.find(
      {},
      { id: 2, name: 'auth', key: 'id', allow: false },
    );
    expect(result.length).toBe(1);
    expect(+result[0].id).toBe(3);
  });

  it('P10: create with bind sets auth relation', async () => {
    const result = await service.create(
      { title: 'Owned Article' } as any,
      [{ name: 'auth' }],
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(result).toBeDefined();
    expect(result.auth).toBeDefined();
    expect(+result.auth.id).toBe(1);
  });

  it('P14: remove by non-owner returns false', async () => {
    const result = await service.remove(
      3,
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(result).toBe(false);
  });

  it('P15: update by non-owner returns undefined', async () => {
    const result = await service.update(
      3,
      { title: 'Hacked' } as any,
      [],
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(result).toBeUndefined();
  });

  it('P16: create with bind.key=email matches by email', async () => {
    const result = await service.create(
      { title: 'Email Match Article' } as any,
      [{ name: 'auth' }],
      { id: 'alice@test', name: 'auth', key: 'email', allow: false } as any,
    );
    expect(result).toBeDefined();
    expect(result.auth).toBeDefined();
    expect(result.auth.email).toBe('alice@test');
  });
});
