import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  BOB_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

describe('README curl examples — verification', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createHttpTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Уровни доступа (operations)
  // ═══════════════════════════════════════════════════════════

  describe('Уровни доступа', () => {
    it('[+] read: public — GET /posts/find без токена → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('[-] read: owner — GET /persons/find без токена → 401', async () => {
      await request(app.getHttpServer())
        .get('/http-owner/find')
        .expect(401);
    });

    it('[+] create: owner — POST /posts/create с токеном → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-owner/create')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({ create: { title: 'README Test', content: 'x', position: 1 } })
        .expect(201);
      expect(res.body.title).toBe('README Test');
    });

    it('[-] create: owner — POST /posts/create без токена → 401', async () => {
      await request(app.getHttpServer())
        .post('/http-owner/create')
        .send({ create: { title: 'Hack', content: 'x', position: 1 } })
        .expect(401);
    });

    it('[+] update: owner — PATCH /posts/update/1 свой → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-owner/update/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({ update: { title: 'README Updated' }, relations: [] })
        .expect(200);
      expect(res.body.title).toBe('README Updated');
    });

    it('[-] update: owner — PATCH /posts/update/3 чужой (bob) → 404', async () => {
      await request(app.getHttpServer())
        .patch('/http-owner/update/3')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({ update: { title: 'Hack' }, relations: [] })
        .expect(404);
    });

    it('[+] create: admin — POST /posts/categories/create админ → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-admin/create')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ create: { title: 'Admin Item', content: 'x', position: 1 } })
        .expect(201);
      expect(res.body.title).toBe('Admin Item');
    });

    it('[-] create: admin — POST /posts/categories/create user → 403', async () => {
      await request(app.getHttpServer())
        .post('/http-admin/create')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({ create: { title: 'Hack', content: 'x', position: 1 } })
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Защита полей (@FieldAccess)
  // secretNotes: read:owner, write:owner
  // lockedNotes: write:closed (эквивалент viewCount из README)
  // ═══════════════════════════════════════════════════════════

  describe('read: owner — стрипинг при чтении', () => {
    it('[-] GET /posts/find без relations → secretNotes стрипается', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      res.body.forEach((article: any) => {
        expect(article.secretNotes).toBeUndefined();
      });
    });

    it('[+] GET /posts/find + relation account → secretNotes виден на своих', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .query({ relations: JSON.stringify([{ name: 'account' }]) })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);

      const own = res.body.find((a: any) => +a.id === 1);
      const others = res.body.find((a: any) => +a.id === 3);

      expect(own.secretNotes).toBeDefined();
      expect(others.secretNotes).toBeUndefined();
    });

    it('[-] GET /posts/find без токена → secretNotes стрипается', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .expect(200);
      res.body.forEach((article: any) => {
        expect(article.secretNotes).toBeUndefined();
      });
    });
  });

  describe('write: closed — стрипинг при записи (эквивалент viewCount)', () => {
    it('[-] POST /posts/create с lockedNotes → стрипается', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-owner/create')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({
          create: {
            title: 'Write Closed Test',
            content: 'x',
            lockedNotes: 'should be stripped',
            position: 77,
          },
        })
        .expect(201);
      expect(res.body.lockedNotes).toBeFalsy();
    });

    it('[-] PATCH /posts/update/1 с lockedNotes → игнорируется', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-owner/update/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({ update: { lockedNotes: 'hack' }, relations: [] })
        .expect(200);
      expect(res.body.lockedNotes).not.toBe('hack');
    });
  });

  describe('write: owner — запись владельцем', () => {
    it('[+] PATCH /posts/update/1 с secretNotes → сохраняется', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-owner/update/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .send({
          update: { secretNotes: 'README verified' },
          relations: [{ name: 'account' }],
        })
        .expect(200);
      expect(res.body.secretNotes).toBe('README verified');
    });
  });
});
