import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { removePrivateFields } from '@core/common';

describe('@FieldAccess({ read: "owner" }) — field-level access control', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P17: owner sees own secretNotes', async () => {
    const result = await service.find(
      {},
      { id: 1, name: 'account', key: 'id', allow: false },
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].secretNotes).toBeDefined();
  });

  it('P18: admin sees all secretNotes', async () => {
    const articles = await service.find({}, { allow: true });
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeDefined();
  });

  it('P19: non-owner secretNotes stripped', async () => {
    const articles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(articles, {
      id: 2,
      name: 'account',
      key: 'id',
      allow: false,
    });
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeUndefined();

    const bobArticle = articles.find((a) => +a.id === 3);
    expect(bobArticle.secretNotes).toBeDefined();
  });

  it('P20: non-owner secretNotes stripped with relations', async () => {
    const articles = await service.find(
      {
        relations: [{ name: 'account' }],
      },
      { allow: true },
    );
    removePrivateFields(articles, {
      id: 2,
      name: 'account',
      key: 'id',
      allow: false,
    });
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeUndefined();
  });

  it('P21: nested relation private fields stripped for non-owner', async () => {
    const articles = await service.find(
      {
        where: { id: 1 },
        relations: [{ name: 'comments' }, { name: 'comments.account' }],
      },
      { allow: true },
    );
    expect(articles.length).toBe(1);
    const article = articles[0];
    expect(article.comments.length).toBe(2);

    removePrivateFields(articles, {
      id: 1,
      name: 'account',
      key: 'id',
      allow: false,
    });

    const aliceComment = article.comments.find((c) => +c.id === 1);
    const bobComment = article.comments.find((c) => +c.id === 2);
    expect(aliceComment.authorIp).toBeDefined();
    expect(bobComment.authorIp).toBeUndefined();
  });
});