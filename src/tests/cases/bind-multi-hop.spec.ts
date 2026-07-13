import { createTestModule } from '../app.testingModule';
import { TestCommentService } from '../services';

describe('bind multi-hop — ownership through dot-path', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestCommentService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestCommentService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('MH1: find — alice sees all comments via article.account', async () => {
    const result = await service.find(
      {},
      { id: 1, name: 'article.account', key: 'id', allow: false },
    );
    expect(result.length).toBe(2);
  });

  it('MH2: find — bob sees no comments via article.account', async () => {
    const result = await service.find(
      {},
      { id: 2, name: 'article.account', key: 'id', allow: false },
    );
    expect(result.length).toBe(0);
  });

  it('MH3: find — admin (allow=true) sees all comments', async () => {
    const result = await service.find(
      {},
      { id: 1, name: 'article.account', key: 'id', allow: true },
    );
    expect(result.length).toBe(2);
  });

  it('MH4: findOne — alice finds comment 1 via article.account', async () => {
    const result = await service.findOne(
      { id: 1 },
      { id: 1, name: 'article.account', key: 'id', allow: false },
    );
    expect(result).toBeDefined();
    expect(+result.id).toBe(1);
  });

  it('MH5: findOne — bob cannot find comment 1 via article.account', async () => {
    const result = await service.findOne(
      { id: 1 },
      { id: 2, name: 'article.account', key: 'id', allow: false },
    );
    expect(result).toBeUndefined();
  });

  it('MH6: update — alice updates comment 1 via article.account', async () => {
    const result = await service.update(
      1,
      { text: 'Updated by alice via multi-hop' } as any,
      [],
      { id: 1, name: 'article.account', key: 'id', allow: false },
    );
    expect(result).toBeDefined();
    expect(result.text).toBe('Updated by alice via multi-hop');
  });

  it('MH7: update — bob cannot update comment 1 via article.account', async () => {
    const result = await service.update(
      1,
      { text: 'Should not update' } as any,
      [],
      { id: 2, name: 'article.account', key: 'id', allow: false },
    );
    expect(result).toBeUndefined();
  });

  it('MH8: remove — bob cannot remove comment 1 via article.account', async () => {
    const result = await service.remove(1, {
      id: 2,
      name: 'article.account',
      key: 'id',
      allow: false,
    });
    expect(result).toBe(false);
  });

  it('MH9: create with multi-hop bind — does not crash, preserves DTO relation', async () => {
    const result = await service.create(
      { text: 'Multi-hop create', article: { id: 1 } } as any,
      [{ name: 'article' }],
      { id: 1, name: 'article.account', key: 'id', allow: false },
    );
    expect(result).toBeDefined();
    expect(result.text).toBe('Multi-hop create');
    expect(+result.article.id).toBe(1);
  });

  it('MH10: remove — alice removes her comment via article.account', async () => {
    const created = await service.create(
      { text: 'To be removed', article: { id: 1 } } as any,
      [{ name: 'article' }],
      { id: 1, name: 'article.account', key: 'id', allow: false },
    );
    const result = await service.remove(+created.id, {
      id: 1,
      name: 'article.account',
      key: 'id',
      allow: false,
    });
    expect(result).toBe(true);
  });
});
