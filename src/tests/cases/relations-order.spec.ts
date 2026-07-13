import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestCommentService } from '../services';

describe('Relations order — relationsOrder()', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articles: TestArticleService;
  let comments: TestCommentService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articles = moduleRef.get(TestArticleService);
    comments = moduleRef.get(TestCommentService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('R1: sort OneToMany relation ASC by id', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments', order: 'id', desc: false }],
    });
    expect(result.length).toBe(1);
    const commentIds = result[0].comments.map((c) => +c.id);
    expect(commentIds).toEqual([...commentIds].sort((a, b) => a - b));
  });

  it('R2: sort OneToMany relation DESC by id', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments', order: 'id', desc: true }],
    });
    expect(result.length).toBe(1);
    const commentIds = result[0].comments.map((c) => +c.id);
    expect(commentIds).toEqual([...commentIds].sort((a, b) => b - a));
  });

  it('R3: sort relation by text field ASC', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments', order: 'text', desc: false }],
    });
    expect(result.length).toBe(1);
    const texts = result[0].comments.map((c) => c.text.toLowerCase());
    const sorted = [...texts].sort();
    expect(texts).toEqual(sorted);
  });

  it('R4: sort relation by text field DESC', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments', order: 'text', desc: true }],
    });
    expect(result.length).toBe(1);
    const texts = result[0].comments.map((c) => c.text.toLowerCase());
    const sorted = [...texts].sort().reverse();
    expect(texts).toEqual(sorted);
  });

  it('R5: no relations param returns result unchanged', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments' }],
    });
    expect(result.length).toBe(1);
    expect(result[0].comments).toBeDefined();
    expect(result[0].comments.length).toBe(2);
  });

  it('R6: relations param without order does not sort', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'comments' }],
    });
    expect(result.length).toBe(1);
    expect(result[0].comments.length).toBe(2);
  });

  it('R7: sort ManyToMany relation ASC', async () => {
    const result = await articles.find({
      where: { id: 1 },
      relations: [{ name: 'tags', order: 'name', desc: false }],
    });
    expect(result.length).toBe(1);
    const names = result[0].tags.map((t) => t.name);
    expect(names).toEqual([...names].sort());
  });

  it('R8: sort across multiple results', async () => {
    const result = await articles.find({
      relations: [{ name: 'comments', order: 'id', desc: true }],
      order: { id: 'ASC' },
    });
    for (const article of result) {
      if (article.comments && article.comments.length > 1) {
        const ids = article.comments.map((c) => +c.id);
        expect(ids).toEqual([...ids].sort((a, b) => b - a));
      }
    }
  });
});
