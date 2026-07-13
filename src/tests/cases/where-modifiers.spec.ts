import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestAuthService } from '../services';

describe('Where modifiers — parseWhereObject', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articles: TestArticleService;
  let auths: TestAuthService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articles = moduleRef.get(TestArticleService);
    auths = moduleRef.get(TestAuthService);

    await articles.create({ title: 'No Content Article' } as any); // 4th article (id=4) with null content for empty/null modifier tests
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('W1: "like" modifier — case-insensitive pattern match', async () => {
    const result = await articles.find({
      where: { 'title.like': '%alice%' },
    });
    expect(result.length).toBe(2);
  });

  it('W2: "not" modifier — exclude exact match', async () => {
    const result = await articles.find({
      where: { 'title.not': 'Alice Post 1' },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(3);
    expect(result.every((r) => r.title !== 'Alice Post 1')).toBe(true);
  });

  it('W3: "between" modifier — range inclusive', async () => {
    const result = await articles.find({
      where: { 'id.between': [1, 2] },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(+result[0].id).toBe(1);
    expect(+result[1].id).toBe(2);
  });

  it('W4: "less" modifier — strictly less than', async () => {
    const result = await articles.find({
      where: { 'id.less': 3 },
    });
    expect(result.length).toBe(2);
  });

  it('W5: "lessOrEqual" modifier — less than or equal', async () => {
    const result = await articles.find({
      where: { 'id.lessOrEqual': 2 },
    });
    expect(result.length).toBe(2);
  });

  it('W6: "moreOrEqual" modifier — greater than or equal', async () => {
    const result = await articles.find({
      where: { 'id.moreOrEqual': 3 },
    });
    expect(result.length).toBe(2);
  });

  it('W7: "any" modifier — match any value in array', async () => {
    const result = await articles.find({
      where: { 'id.any': [1, 3] },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
  });

  it('W8: "null" modifier — field is NULL', async () => {
    const result = await articles.find({
      where: { 'content.null': true },
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((r) => r.content === '' || r.content === null)).toBe(
      true,
    );
  });

  it('W9: "empty" modifier — field is NULL or empty string', async () => {
    const result = await articles.find({
      where: { 'content.empty': true },
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('W10: "boolean" modifier — true string matches boolean column', async () => {
    const result = await auths.find({
      where: { 'isSuperuser.boolean': 'true' },
    });
    expect(result.length).toBe(1);
    expect(result[0].isSuperuser).toBe(true);
  });

  it('W11: "boolean" modifier — false string matches boolean column', async () => {
    const result = await auths.find({
      where: { 'isSuperuser.boolean': 'false' },
    });
    expect(result.length).toBe(2);
    expect(result.every((r) => r.isSuperuser === false)).toBe(true);
  });

  it('W12: "boolean" modifier — "1" coerces to true', async () => {
    const result = await auths.find({
      where: { 'isSuperuser.boolean': '1' },
    });
    expect(result.length).toBe(1);
  });

  it('W13: "boolean" modifier — "0" coerces to false', async () => {
    const result = await auths.find({
      where: { 'isSuperuser.boolean': '0' },
    });
    expect(result.length).toBe(2);
  });

  it('W14: "number" modifier — string to float conversion', async () => {
    const result = await articles.find({
      where: { 'id.number': '2' },
    });
    expect(result.length).toBe(1);
    expect(+result[0].id).toBe(2);
  });

  it('W15: "string" modifier — exact string match', async () => {
    const result = await articles.find({
      where: { 'title.string': 'Alice Post 1' },
    });
    expect(result.length).toBe(1);
  });

  it('W16: "search" modifier — tokenized ILIKE', async () => {
    const result = await articles.find({
      where: { 'title.search': 'alice post' },
    });
    expect(result.length).toBe(2);
    expect(result.every((r) => r.title.includes('Alice'))).toBe(true);
  });

  it('W17: "and" combinator with "like" — all patterns must match', async () => {
    const result = await articles.find({
      where: {
        'title.and.like': ['%alice%', '%post%'],
      },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
  });

  it('W18: "or" combinator with "like" — any pattern matches', async () => {
    const result = await articles.find({
      where: {
        'title.or.like': ['%bob%', '%1%'],
      },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
  });

  it('W19: "and" combinator with "more" — both conditions must hold', async () => {
    const result = await articles.find({
      where: {
        'id.and.more': [1, 2],
      },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(result.every((r) => +r.id > 2)).toBe(true);
  });

  it('W20: "or" combinator with "less" — either condition', async () => {
    const result = await articles.find({
      where: {
        'id.or.less': [2, 3],
      },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(+result[0].id).toBe(1);
    expect(+result[1].id).toBe(2);
  });

  it('W21: nested object where — relation property', async () => {
    const result = await articles.find({
      where: { auth: { id: 1 } },
      relations: [{ name: 'auth' }],
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(result.every((r) => +r.auth.id === 1)).toBe(true);
  });

  it('W22: chained modifiers — "not.like" (not ILIKE)', async () => {
    const result = await articles.find({
      where: { 'title.not.like': '%alice%' },
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(result.every((r) => !r.title.toLowerCase().includes('alice'))).toBe(
      true,
    );
  });

  it('W23: chained modifiers — "and.not.like" array', async () => {
    const result = await articles.find({
      where: {
        'title.and.not.like': ['%alice%', '%bob%'],
      },
    });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('No Content Article');
  });
});
