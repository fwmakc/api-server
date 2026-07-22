import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestCourseService } from '../services';
import { removePrivateFields } from '@core/common';

describe('Nested field access — computeNestedBind propagation', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;
  let courseService: TestCourseService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
    courseService = moduleRef.get(TestCourseService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ═══════════════════════════════════════════════════════════
  // End-of-path: bind path reaches the entity itself → name becomes ''
  // canRead uses dto itself as the owner candidate (dto.id === bind.id)
  // ═══════════════════════════════════════════════════════════
  describe('End-of-path (name === "")', () => {
    it('N1: alice sees own email on own article account', async () => {
      const articles = await articleService.find(
        { where: { id: 1 }, relations: [{ name: 'account' }] },
        { id: 1, name: 'account', key: 'id', allow: false },
      );
      expect(articles.length).toBe(1);
      expect(articles[0].secretNotes).toBeDefined();
      expect((articles[0] as any).account.email).toBeDefined();
    });

    it('N2: bob email stripped when bind is alice (end-of-path mismatch)', async () => {
      const articles = await articleService.find(
        { where: { id: 3 }, relations: [{ name: 'account' }] },
        { allow: true },
      );
      expect(articles.length).toBe(1);
      removePrivateFields(articles, {
        id: 1,
        name: 'account',
        key: 'id',
        allow: false,
      });
      expect(articles[0].secretNotes).toBeUndefined();
      expect((articles[0] as any).account.email).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Off-path: entities not on the bind path get name: ''
  // Their owner-only fields are checked against dto.id, which is
  // unreliable — but with a non-matching bind.id everything is stripped
  // ═══════════════════════════════════════════════════════════
  describe('Off-path entities', () => {
    it('N3: all off-path owner fields stripped (non-matching bind.id)', async () => {
      const articles = await articleService.find(
        {
          where: { id: 1 },
          relations: [
            { name: 'comments' },
            { name: 'comments.account' },
          ],
        },
        { allow: true },
      );
      removePrivateFields(articles, {
        id: 999,
        name: 'account',
        key: 'id',
        allow: false,
      });
      const article = articles[0] as any;
      expect(article.secretNotes).toBeUndefined();
      article.comments.forEach((c: any) => {
        expect(c.authorIp).toBeUndefined();
        expect(c.account.email).toBeUndefined();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Fail-closed: unresolvable multi-hop bind path → owner fields stripped
  // ═══════════════════════════════════════════════════════════
  describe('Fail-closed', () => {
    it('N4: unresolvable bind path → owner fields stripped', async () => {
      const articles = await articleService.find(
        { where: { id: 1 }, relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(articles, {
        id: 1,
        name: 'account.profile',
        key: 'id',
        allow: false,
      });
      // account.profile not loaded → path resolves to undefined → fail-closed
      expect(articles[0].secretNotes).toBeUndefined();
    });

    it('N5: unresolvable deep path → stripped even for own record', async () => {
      const articles = await articleService.find(
        { where: { id: 1 }, relations: [{ name: 'account' }] },
        { allow: true },
      );
      removePrivateFields(articles, {
        id: 1,
        name: 'account.profile.internalNotes',
        key: 'id',
        allow: false,
      });
      expect(articles[0].secretNotes).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Deep nested: course → enrolls → student → account
  // Multi-hop bind propagates correctly through 3 levels
  // ═══════════════════════════════════════════════════════════
  describe('Deep nested bind path (3 hops)', () => {
    it('N6: alice sees own email through enrolls.student.account path', async () => {
      const courses = await courseService.find(
        {
          where: { id: 1 },
          relations: [
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        { allow: true },
      );
      removePrivateFields(courses, {
        id: 1,
        name: 'enrolls.student.account',
        key: 'id',
        allow: false,
      });
      const course = courses[0] as any;
      // Both enrolls in course 1 are Alice's → email visible
      course.enrolls.forEach((e: any) => {
        expect(e.student.account.email).toBeDefined();
      });
    });

    it('N7: bob cannot see alice email through deep path', async () => {
      const courses = await courseService.find(
        {
          where: { id: 1 },
          relations: [
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        { allow: true },
      );
      removePrivateFields(courses, {
        id: 2,
        name: 'enrolls.student.account',
        key: 'id',
        allow: false,
      });
      const course = courses[0] as any;
      // All enrolls in course 1 are Alice's (account.id=1 ≠ 2) → email stripped
      course.enrolls.forEach((e: any) => {
        expect(e.student.account.email).toBeUndefined();
      });
    });
  });
});
