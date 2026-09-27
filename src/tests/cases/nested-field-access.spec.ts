import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { removePrivateFields } from 'api-server-toolkit';

// В новой модели поля видны по ролям (who-only). Вложенные сущности
// обрабатываются по своим конфигам рекурсивно: стрипается и поле корня,
// и поля вложенных relations.
const editor = { id: 1, roles: ['editor'] };
const plain = { id: 2, roles: [] };
const anonymous = { roles: ['public'] };

describe('Nested field rules — recursive stripping', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N1: editor sees nested account.email and secretNotes', async () => {
    const articles = await articleService.find(
      { where: { id: 1 }, relations: [{ name: 'account' }] },
      { allow: true },
    );
    expect(articles.length).toBe(1);
    removePrivateFields(articles, editor);
    expect(articles[0].secretNotes).toBeDefined();
    expect((articles[0] as any).account.email).toBeDefined();
  });

  it('N2: authenticated user without roles — role-only fields stripped, authenticated fields visible', async () => {
    const articles = await articleService.find(
      { where: { id: 3 }, relations: [{ name: 'account' }] },
      { allow: true },
    );
    expect(articles.length).toBe(1);
    // plain — реальный аккаунт (id задан): неявно authenticated.
    removePrivateFields(articles, plain);
    expect(articles[0].secretNotes).toBeUndefined();
    expect((articles[0] as any).account.email).toBeDefined();
  });

  it('N3: anonymous has nested fields stripped', async () => {
    const articles = await articleService.find(
      { where: { id: 1 }, relations: [{ name: 'account' }] },
      { allow: true },
    );
    removePrivateFields(articles, anonymous);
    expect(articles[0].secretNotes).toBeUndefined();
    expect((articles[0] as any).account.email).toBeUndefined();
  });

  it('N4: deep nesting — comments and their accounts stripped together', async () => {
    const articles = await articleService.find(
      {
        where: { id: 1 },
        relations: [{ name: 'comments' }, { name: 'comments.account' }],
      },
      { allow: true },
    );
    removePrivateFields(articles, plain);
    const article = articles[0] as any;
    expect(article.secretNotes).toBeUndefined();
    article.comments.forEach((c: any) => {
      // authorIp — read: editor/superuser → стрипается; email — read: authenticated → виден.
      expect(c.authorIp).toBeUndefined();
      expect(c.account.email).toBeDefined();
    });
  });

  it('N5: deep nesting — editor sees comments and their accounts', async () => {
    const articles = await articleService.find(
      {
        where: { id: 1 },
        relations: [{ name: 'comments' }, { name: 'comments.account' }],
      },
      { allow: true },
    );
    removePrivateFields(articles, editor);
    const article = articles[0] as any;
    expect(article.secretNotes).toBeDefined();
    article.comments.forEach((c: any) => {
      expect(c.authorIp).toBeDefined();
      expect(c.account.email).toBeDefined();
    });
  });
});
