import { createTestModule } from '../app.testingModule';
import { TestCourseService, TestEnrollService } from '../services';
import { PermissionRegistry } from 'api-server-toolkit';
import { TestEnrollEntity } from '../entities';

// ═══════════════════════════════════════════════════════════════
// SERVICE-LEVEL: Nested filtering, sorting, pagination, auto-assign
// ═══════════════════════════════════════════════════════════════
describe('Security features — service-level', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let courseService: TestCourseService;
  let enrollService: TestEnrollService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    courseService = moduleRef.get(TestCourseService);
    enrollService = moduleRef.get(TestEnrollService);

    PermissionRegistry.set(TestEnrollEntity, {
      create: 'owner',
      read: 'owner',
      update: 'owner',
      delete: 'owner',
      accountTable: 'student.account',
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  const aliceBind = { id: 1, name: 'enrolls.student.account', key: 'id', allow: false };
  const bobBind = { id: 2, name: 'enrolls.student.account', key: 'id', allow: false };
  const adminBind = { id: 3, name: 'enrolls.student.account', key: 'id', allow: true };

  // ── Task 7: Nested relation auto-filtering ──
  describe('Nested relation auto-filtering', () => {
    it('alice loads course 3 with enrolls → only sees own enroll', async () => {
      const result = await courseService.find(
        {
          where: { id: 3 },
          relations: [
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        aliceBind,
      );
      expect(result.length).toBe(1);
      const course: any = result[0];
      expect(+course.id).toBe(3);
      expect(course.enrolls).toBeDefined();
      expect(course.enrolls.length).toBe(1);
      expect(+course.enrolls[0].id).toBe(3);
    });

    it('bob loads course 3 with enrolls → only sees own enroll', async () => {
      const result = await courseService.find(
        {
          where: { id: 3 },
          relations: [
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        bobBind,
      );
      expect(result.length).toBe(1);
      const course: any = result[0];
      expect(course.enrolls.length).toBe(1);
      expect(+course.enrolls[0].id).toBe(4);
    });

    it('admin loads course 3 with enrolls → sees all enrolls (bypass)', async () => {
      const result = await courseService.find(
        {
          where: { id: 3 },
          relations: [
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        adminBind,
      );
      const course: any = result[0];
      expect(course.enrolls.length).toBe(2);
    });
  });

  // ── Task 8: Sorting relations ──
  describe('Sorting relations', () => {
    it('course 3 enrolls sorted by createdAt desc', async () => {
      const result = await courseService.find(
        {
          where: { id: 3 },
          relations: [
            { name: 'enrolls', order: 'createdAt', desc: true },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ],
        },
        aliceBind,
      );
      const course: any = result[0];
      expect(course.enrolls.length).toBe(1);
    });

    it('admin sees enrolls sorted by id desc on course 3', async () => {
      const result = await courseService.find(
        {
          where: { id: 3 },
          relations: [{ name: 'enrolls', order: 'id', desc: true }],
        },
        adminBind,
      );
      const course: any = result[0];
      expect(course.enrolls.length).toBe(2);
      expect(+course.enrolls[0].id).toBeGreaterThan(+course.enrolls[1].id);
    });
  });

  // ── Task 5: Pagination with multi-hop ──
  describe('Pagination with multi-hop bind', () => {
    it('limit=1 returns 1 course (not affected by JOIN duplicates)', async () => {
      const result = await courseService.find(
        { limit: 1 },
        aliceBind,
      );
      expect(result.length).toBe(1);
    });

    it('limit=1 offset=1 returns second course', async () => {
      const first = await courseService.find(
        { limit: 1, offset: 0 },
        aliceBind,
      );
      const second = await courseService.find(
        { limit: 1, offset: 1 },
        aliceBind,
      );
      expect(first.length).toBe(1);
      expect(second.length).toBe(1);
      expect(+first[0].id).not.toBe(+second[0].id);
    });

    it('admin limit=2 returns exactly 2 courses', async () => {
      const result = await courseService.find(
        { limit: 2 },
        adminBind,
      );
      expect(result.length).toBe(2);
    });
  });

  // ── Task 3: Multi-hop auto-assign ──
  describe('Multi-hop auto-assign on create', () => {
    it('create enroll with student.account bind → auto-assigns student', async () => {
      const enrollBind = { id: 1, name: 'student.account', key: 'id', allow: false };
      const result = await enrollService.create(
        { status: 'active' } as any,
        [{ name: 'student' }],
        enrollBind,
      );
      expect(result).toBeDefined();
      expect(+result.id).toBeGreaterThan(0);
      expect((result as any).student).toBeDefined();
      expect(+((result as any).student).id).toBe(1);
    });

    it('create enroll with non-existent account → throws NotFoundException', async () => {
      const fakeBind = { id: 999, name: 'student.account', key: 'id', allow: false };
      await expect(
        enrollService.create(
          { status: 'active' } as any,
          undefined,
          fakeBind,
        ),
      ).rejects.toThrow();
    });

    it('create course with ToMany-first-segment bind → no auto-assign, no crash', async () => {
      const courseBind = { id: 1, name: 'enrolls.student.account', key: 'id', allow: false };
      await expect(
        courseService.create(
          { title: 'ToManySkipUnique' } as any,
          undefined,
          courseBind,
        ),
      ).resolves.not.toThrow();

      const found = await courseService.find(
        { where: { title: 'ToManySkipUnique' } as any },
        { allow: true },
      );
      expect(found.length).toBe(1);
      expect((found[0] as any).title).toBe('ToManySkipUnique');
    });
  });

  // ── Pagination with duplicate JOINs ──
  describe('Pagination with duplicate JOINs', () => {
    it('course 1 has 2 Alice enrolls → alice sees it once (not duplicated)', async () => {
      const all = await courseService.find({}, aliceBind);
      // Alice enrolled in course 1 (enrolls 1,5) and course 3 (enroll 3)
      expect(all.length).toBe(2);
      const ids = all.map((c: any) => +c.id).sort();
      expect(ids).toEqual([1, 3]);
    });

    it('limit=1 offset=0 returns 1 course despite duplicate JOINs', async () => {
      const first = await courseService.find(
        { limit: 1, offset: 0 },
        aliceBind,
      );
      expect(first.length).toBe(1);
    });

    it('limit=1 offset=1 returns the other course (not a duplicate)', async () => {
      const first = await courseService.find(
        { limit: 1, offset: 0 },
        aliceBind,
      );
      const second = await courseService.find(
        { limit: 1, offset: 1 },
        aliceBind,
      );
      expect(first.length).toBe(1);
      expect(second.length).toBe(1);
      expect(+first[0].id).not.toBe(+second[0].id);
    });
  });
});
