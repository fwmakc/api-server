import { createTestModule } from '../app.testingModule';
import { TestCourseService } from '../services';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  BOB_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

// ═══════════════════════════════════════════════════════════════
// SERVICE-LEVEL: 4-hop bindPath (enrolls.student.account)
// ═══════════════════════════════════════════════════════════════
describe('Enrollment access — service-level (4-hop bindPath)', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestCourseService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestCourseService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  const aliceBind = { id: 1, name: 'enrolls.student.account', key: 'id', allow: false };
  const bobBind = { id: 2, name: 'enrolls.student.account', key: 'id', allow: false };
  const adminBind = { id: 3, name: 'enrolls.student.account', key: 'id', allow: true };

  it('find — alice sees 2 enrolled courses (1, 3)', async () => {
    const result = await service.find({}, aliceBind);
    expect(result.length).toBe(2);
    const ids = result.map((r: any) => +r.id).sort();
    expect(ids).toEqual([1, 3]);
  });

  it('find — bob sees 2 enrolled courses (2, 3)', async () => {
    const result = await service.find({}, bobBind);
    expect(result.length).toBe(2);
    const ids = result.map((r: any) => +r.id).sort();
    expect(ids).toEqual([2, 3]);
  });

  it('find — admin (allow=true) sees all 3 courses', async () => {
    const result = await service.find({}, adminBind);
    expect(result.length).toBe(3);
  });

  it('findOne — alice finds course 1 (enrolled)', async () => {
    const result = await service.findOne({ id: 1 }, aliceBind);
    expect(result).toBeDefined();
    expect(+result.id).toBe(1);
  });

  it('findOne — alice cannot find course 2 (not enrolled)', async () => {
    const result = await service.findOne({ id: 2 }, aliceBind);
    expect(result).toBeUndefined();
  });

  it('findOne — bob finds course 2 (enrolled)', async () => {
    const result = await service.findOne({ id: 2 }, bobBind);
    expect(result).toBeDefined();
    expect(+result.id).toBe(2);
  });

  it('findOne — bob finds course 3 (enrolled, shared with alice)', async () => {
    const result = await service.findOne({ id: 3 }, bobBind);
    expect(result).toBeDefined();
    expect(+result.id).toBe(3);
  });

  it('count — alice counts 2 enrolled courses', async () => {
    const count = await service.count({}, aliceBind);
    expect(count).toBe(2);
  });

  it('remove — alice cannot remove course 2 (not enrolled)', async () => {
    const result = await service.remove(2, aliceBind);
    expect(result).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// HTTP-LEVEL: EntityController with accountTable: 'enrolls.student.account'
// ═══════════════════════════════════════════════════════════════
describe('Enrollment access — HTTP-level (EntityController)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createHttpTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /http-courses/find', () => {
    it('without token → 401', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find')
        .expect(401);
    });

    it('with alice → 200, 2 courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
      const ids = res.body.map((r: any) => +r.id).sort();
      expect(ids).toEqual([1, 3]);
    });

    it('with bob → 200, 2 courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find')
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
      const ids = res.body.map((r: any) => +r.id).sort();
      expect(ids).toEqual([2, 3]);
    });

    it('with admin → 200, 3 courses (bypass)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(3);
    });
  });

  describe('GET /http-courses/find/:id', () => {
    it('enrolled course with alice → 200', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
    });

    it('not-enrolled course with alice → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find/2')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(404);
    });

    it('enrolled course with bob → 200', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find/2')
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
    });

    it('shared course (3) with alice → 200', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find/3')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
    });

    it('shared course (3) with bob → 200', async () => {
      await request(app.getHttpServer())
        .get('/http-courses/find/3')
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
    });
  });

  describe('GET /http-courses/self', () => {
    it('with alice → 200, 2 courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/self')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
    });

    it('with bob → 200, 2 courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/self')
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /http-courses/count', () => {
    it('with alice → 2', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/count')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(Number(res.text)).toBe(2);
    });
  });

  describe('write operations (admin-only)', () => {
    it('POST /create without admin → 403', async () => {
      await request(app.getHttpServer())
        .post('/http-courses/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('PATCH /update/:id without admin → 403', async () => {
      await request(app.getHttpServer())
        .patch('/http-courses/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('DELETE /remove/:id without admin → 403', async () => {
      await request(app.getHttpServer())
        .delete('/http-courses/remove/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });
  });
});
