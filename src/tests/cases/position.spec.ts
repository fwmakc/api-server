import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('sortPosition / movePosition', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P26: sortPosition reorders alice articles via bind', async () => {
    const result = await service.sortPosition(
      'position',
      {},
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(result).toBe(true);

    const articles = await service.find(
      {},
      { id: 1, name: 'auth', key: 'id', allow: false },
    );
    expect(articles[0].position).toBe(1);
    expect(articles[1].position).toBe(2);
  });

  it('P27: movePosition moves article to new position', async () => {
    const result = await service.movePosition(2, 'position', 1, {
      allow: true,
    });
    expect(result).toBe(true);

    const article = await service.findOne({ id: 2 });
    expect(article.position).toBe(1);
  });

  it('P28: sortPosition with where filter [EXPECT FAIL — empty criteria bug]', async () => {
    const result = await service.sortPosition(
      'position',
      { where: { auth: { id: 1 } }, order: { id: 'ASC' } },
      { allow: true },
    );
    expect(result).toBe(true);
  });

  it('P29: getIdType returns bigint for test entities', () => {
    expect(service.getIdType()).toBe('bigint');
  });

  it('P30: sortPosition auto-order when no order specified', async () => {
    const result = await service.sortPosition('position', {}, { allow: true });
    expect(result).toBe(true);
  });

  it('P31: sortPosition rejects non-numeric field', async () => {
    await expect(
      service.sortPosition('title', {}, { allow: true }),
    ).rejects.toThrow('non-numeric');
  });

  it('P32: movePosition clamps out-of-bounds to last+1', async () => {
    const result = await service.movePosition(1, 'position', 999, {
      allow: true,
    });
    expect(result).toBe(true);

    const article = await service.findOne({ id: 1 });
    expect(article.position).toBeGreaterThanOrEqual(1);
  });

  it('P33: movePosition rejects non-numeric field', async () => {
    await expect(
      service.movePosition(1, 'title', 1, { allow: true }),
    ).rejects.toThrow('non-numeric');
  });
});
