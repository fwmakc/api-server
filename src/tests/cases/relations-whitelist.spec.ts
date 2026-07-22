import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  BOB_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

describe('Relations whitelist & deny-by-default', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createHttpTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Whitelisted relations load correctly
  // ═══════════════════════════════════════════════════════════
  describe('Whitelisted relations loaded', () => {
    it('RW1: account relation loaded (in whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .query({ relations: JSON.stringify([{ name: 'account' }]) })
        .expect(200);
      expect(res.body.account).toBeDefined();
      expect(+res.body.account.id).toBe(1);
    });

    it('RW2: comments.account loaded (nested whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .query({
          relations: JSON.stringify([
            { name: 'comments' },
            { name: 'comments.account' },
          ]),
        })
        .expect(200);
      expect(res.body.comments).toBeDefined();
      expect(res.body.comments.length).toBe(2);
      expect(res.body.comments[0].account).toBeDefined();
    });

    it('RW3: tags loaded (in whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .query({ relations: JSON.stringify([{ name: 'tags' }]) })
        .expect(200);
      expect(res.body.tags).toBeDefined();
      expect(res.body.tags.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Non-whitelisted relations silently stripped
  // ═══════════════════════════════════════════════════════════
  describe('Non-whitelisted relations stripped', () => {
    it('RW4: comments stripped on partial-whitelist controller', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-partial/find/1')
        .query({ relations: JSON.stringify([{ name: 'comments' }]) })
        .expect(200);
      expect(res.body.comments).toBeUndefined();
    });

    it('RW5: tags stripped on partial-whitelist controller', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-partial/find/1')
        .query({ relations: JSON.stringify([{ name: 'tags' }]) })
        .expect(200);
      expect(res.body.tags).toBeUndefined();
    });

    it('RW6: account still loads on partial-whitelist controller', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-partial/find/1')
        .query({ relations: JSON.stringify([{ name: 'account' }]) })
        .expect(200);
      expect(res.body.account).toBeDefined();
      expect(+res.body.account.id).toBe(1);
    });

    it('RW7: comments.account stripped when comments not in partial whitelist', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-partial/find/1')
        .query({
          relations: JSON.stringify([
            { name: 'comments' },
            { name: 'comments.account' },
          ]),
        })
        .expect(200);
      expect(res.body.comments).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Deny-all when no relations field provided
  // ═══════════════════════════════════════════════════════════
  describe('Deny-all without relations field', () => {
    it('RW8: all relations stripped on no-relations controller', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-no-relations/find/1')
        .query({
          relations: JSON.stringify([
            { name: 'account' },
            { name: 'comments' },
            { name: 'tags' },
          ]),
        })
        .expect(200);
      expect(res.body.account).toBeUndefined();
      expect(res.body.comments).toBeUndefined();
      expect(res.body.tags).toBeUndefined();
    });

    it('RW9: entity data still loads (only relations stripped)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-no-relations/find/1')
        .expect(200);
      expect(+res.body.id).toBe(1);
      expect(res.body.title).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Exact string match required
  // ═══════════════════════════════════════════════════════════
  describe('Exact match required', () => {
    it('RW10: partial path not matched (comments.acc ≠ comments.account)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .query({
          relations: JSON.stringify([
            { name: 'comments' },
            { name: 'comments.acc' },
          ]),
        })
        .expect(200);
      // comments IS whitelisted → loaded
      expect(res.body.comments).toBeDefined();
      // comments.acc is NOT in whitelist → comments won't have account loaded
      expect(res.body.comments[0].account).toBeUndefined();
    });

    it('RW11: unknown relation name stripped', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .query({
          relations: JSON.stringify([{ name: 'nonexistent' }]),
        })
        .expect(200);
      expect(res.body.nonexistent).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Deny-by-default: no operations field → all routes 404
  // ═══════════════════════════════════════════════════════════
  describe('Deny-by-default operations (no operations field)', () => {
    it('RW12: find → 404 (read defaults to closed)', async () => {
      await request(app.getHttpServer())
        .get('/http-default/find')
        .expect(404);
    });

    it('RW13: findOne → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-default/find/1')
        .expect(404);
    });

    it('RW14: create → 404', async () => {
      await request(app.getHttpServer())
        .post('/http-default/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .expect(404);
    });

    it('RW15: update → 404', async () => {
      await request(app.getHttpServer())
        .patch('/http-default/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .expect(404);
    });

    it('RW16: remove → 404', async () => {
      await request(app.getHttpServer())
        .delete('/http-default/remove/1')
        .expect(404);
    });

    it('RW17: find → 404 even with admin token', async () => {
      await request(app.getHttpServer())
        .get('/http-default/find')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // HTTP-level nested filtering
  // ═══════════════════════════════════════════════════════════
  describe('HTTP nested relation auto-filtering', () => {
    it('RW18: alice loads courses → only sees enrolled courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      // Alice is enrolled in course 1 (enrolls 1,5) and course 3 (enroll 3)
      expect(res.body.length).toBe(2);
      const ids = res.body.map((c: any) => +c.id).sort();
      expect(ids).toEqual([1, 3]);
    });

    it('RW19: alice loads course 3 with enrolls → only own enroll', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find/3')
        .query({
          relations: JSON.stringify([
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ]),
        })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(+res.body.id).toBe(3);
      expect(res.body.enrolls).toBeDefined();
      expect(res.body.enrolls.length).toBe(1);
      expect(+res.body.enrolls[0].id).toBe(3);
    });

    it('RW20: bob loads course 3 with enrolls → only own enroll', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find/3')
        .query({
          relations: JSON.stringify([
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ]),
        })
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
      expect(+res.body.id).toBe(3);
      expect(res.body.enrolls.length).toBe(1);
      expect(+res.body.enrolls[0].id).toBe(4);
    });

    it('RW21: admin loads course 3 → sees all enrolls (bypass)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find/3')
        .query({
          relations: JSON.stringify([
            { name: 'enrolls' },
            { name: 'enrolls.student' },
          ]),
        })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.enrolls.length).toBe(2);
    });

    it('RW22: alice loads course 1 with enrolls → only own enrolls (2 of 2)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-courses/find/1')
        .query({
          relations: JSON.stringify([
            { name: 'enrolls' },
            { name: 'enrolls.student' },
            { name: 'enrolls.student.account' },
          ]),
        })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      // Course 1 has enroll 1 (Alice) and enroll 5 (Alice)
      // Both belong to Alice → both visible
      expect(res.body.enrolls.length).toBe(2);
    });
  });
});
