import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { removePrivateFields } from 'api-server-toolkit';

// В новой модели поля видны по РОЛЯМ (who-only): editor видит secretNotes
// на всех статьях, пользователь без роли — ни на одной, суперюзер — байпас.
const editor = { id: 1, roles: ['editor'] };
const plain = { id: 2, roles: [] };

describe('Field rules — read stripping by roles', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P17: editor sees secretNotes', async () => {
    const result = await service.find({ where: { id: 1 } }, { allow: true });
    expect(result.length).toBe(1);
    removePrivateFields(result, editor);
    expect(result[0].secretNotes).toBeDefined();
  });

  it('P18: raw service.find returns everything (stripping is a read-layer concern)', async () => {
    const articles = await service.find({}, { allow: true });
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeDefined();
  });

  it('P19: user without roles has secretNotes stripped', async () => {
    const articles = await service.find(
      { relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(articles, plain);
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeUndefined();

    const bobArticle = articles.find((a) => +a.id === 3);
    expect(bobArticle.secretNotes).toBeUndefined();
  });

  it('P20: editor sees secretNotes on all articles', async () => {
    const articles = await service.find(
      {
        relations: [{ name: 'account' }],
      },
      { allow: true },
    );
    removePrivateFields(articles, editor);
    const aliceArticle = articles.find((a) => +a.id === 1);
    expect(aliceArticle.secretNotes).toBeDefined();

    const bobArticle = articles.find((a) => +a.id === 3);
    expect(bobArticle.secretNotes).toBeDefined();
  });

  it('P21: nested relation private fields stripped for user without roles', async () => {
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

    removePrivateFields(articles, plain);

    const aliceComment = article.comments.find((c) => +c.id === 1);
    const bobComment = article.comments.find((c) => +c.id === 2);
    expect(aliceComment.authorIp).toBeUndefined();
    expect(bobComment.authorIp).toBeUndefined();
  });

  it('P21a: editor sees nested authorIp', async () => {
    const articles = await service.find(
      {
        where: { id: 1 },
        relations: [{ name: 'comments' }, { name: 'comments.account' }],
      },
      { allow: true },
    );
    removePrivateFields(articles, editor);

    const article = articles[0];
    const aliceComment = article.comments.find((c) => +c.id === 1);
    const bobComment = article.comments.find((c) => +c.id === 2);
    expect(aliceComment.authorIp).toBeDefined();
    expect(bobComment.authorIp).toBeDefined();
  });

  describe('write access (write rules by roles)', () => {
    it('P22: editor can write secretNotes', async () => {
      const result = await service.update(
        1,
        { secretNotes: 'editor updated notes' } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false, roles: ['editor'] },
      );
      expect(result).toBeDefined();
      expect(result.secretNotes).toBe('editor updated notes');
    });

    it('P23: user without roles cannot write secretNotes', async () => {
      const result = await service.update(
        1,
        { secretNotes: 'hacked notes' } as any,
        undefined,
        { id: 1, name: 'account', key: 'id', allow: false, roles: [] },
      );
      expect(result).toBeDefined();
      expect(result.secretNotes).not.toBe('hacked notes');
    });
  });
});
