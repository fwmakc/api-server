import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('Negative / security tests', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N1: findOne with non-existent ID returns undefined', async () => {
    const result = await service.findOne({ id: 999999 });
    expect(result).toBeUndefined();
  });

  it('N2: update non-existent ID returns undefined', async () => {
    const result = await service.update(999999, { title: 'Nope' } as any, []);
    expect(result).toBeUndefined();
  });

  it('N3: remove non-existent ID returns false', async () => {
    const result = await service.remove(999999);
    expect(result).toBe(false);
  });

  it('N4: non-owner cannot update via bind', async () => {
    const result = await service.update(
      1,
      { title: 'Hacked' } as any,
      [],
      { id: 2, name: 'auth', key: 'id', allow: false },
    );
    expect(result).toBeUndefined();

    const article = await service.findOne({ id: 1 });
    expect(article.title).not.toBe('Hacked');
  });

  it('N5: non-owner cannot remove via bind', async () => {
    const result = await service.remove(1, {
      id: 2,
      name: 'auth',
      key: 'id',
      allow: false,
    });
    expect(result).toBe(false);

    const article = await service.findOne({ id: 1 });
    expect(article).toBeDefined();
  });

  it('N6: SQL injection in where is parameterized (no extra results)', async () => {
    const result = await service.find({
      where: { title: "'; DROP TABLE test_articles; --" },
    });
    expect(result.length).toBe(0);

    const all = await service.find({});
    expect(all.length).toBeGreaterThan(0);
  });

  it('N7: PostgreSQL rejects string injection in bigint column', async () => {
    await expect(
      service.find({ where: { id: '1 OR 1=1' } }),
    ).rejects.toThrow('invalid input syntax');
  });

  it('N8: XSS payload stored as literal string (sanitization is view-layer)', async () => {
    const xss = '<script>alert("xss")</script>';
    const result = await service.create({ title: xss } as any);
    expect(result.title).toBe(xss);
  });

  it('N9: count returns correct number', async () => {
    const result = await service.count({});
    expect(result).toBe(4);
  });

  it('N10: find with limit returns subset', async () => {
    const result = await service.find({ limit: 1 });
    expect(result.length).toBe(1);
  });

  it('N11: find with offset skips entries', async () => {
    const all = await service.find({});
    const skipped = await service.find({ limit: 999, offset: 1 });
    expect(skipped.length).toBe(all.length - 1);
  });

  it('N12: where modifier "id.more" works correctly', async () => {
    const result = await service.find({
      where: { 'id.more': 1 },
    });
    expect(result.length).toBe(3);
    expect(result.every((a) => +a.id > 1)).toBe(true);
  });

  it('N13: where modifier "id.in" works correctly', async () => {
    const result = await service.find({
      where: { 'id.in': [1, 3] },
    });
    expect(result.length).toBe(2);
  });

  it('N14: movePosition on non-existent ID returns false', async () => {
    const result = await service.movePosition(999999, 'position', 1);
    expect(result).toBe(false);
  });

  it('N15: movePosition to same position returns false', async () => {
    const article = await service.findOne({ id: 1, select: { position: true } });
    const result = await service.movePosition(1, 'position', +article.position);
    expect(result).toBe(false);
  });
});
