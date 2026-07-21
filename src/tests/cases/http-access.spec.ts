import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  BOB_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

describe('HTTP Access Control — full guard pipeline', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createHttpTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════
  // PUBLIC — token optional, no row scoping
  // ═══════════════════════════════════════════════════════════
  describe('public level', () => {
    it('find without token → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('findOne without token → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find/1')
        .expect(200);
      expect(res.body).toBeDefined();
      expect(+res.body.id).toBe(1);
    });

    it('count without token → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/count')
        .expect(200);
      expect(Number(res.text)).toBeGreaterThanOrEqual(3);
    });

    it('create without token → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-public/create')
        .send({ create: { title: 'Public Created' }, relations: [] })
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.title).toBe('Public Created');
    });

    it('update without token → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-public/update/1')
        .send({ update: { title: 'Public Updated' }, relations: [] })
        .expect(200);
      expect(res.body.title).toBe('Public Updated');
    });

    it('remove without token → 200', async () => {
      const created = await request(app.getHttpServer())
        .post('/http-public/create')
        .send({ create: { title: 'To Delete' }, relations: [] });
      await request(app.getHttpServer())
        .delete(`/http-public/remove/${created.body.id}`)
        .expect(200);
    });

    it('find with token → 200 (token does not break public)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-public/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('create with token → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-public/create')
        .send({ create: { title: 'Public With Token' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);
      expect(res.body.title).toBe('Public With Token');
    });

    it('update with token → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-public/update/1')
        .send({ update: { title: 'Public Updated With Token' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Public Updated With Token');
    });

    it('remove with token → 200', async () => {
      const created = await request(app.getHttpServer())
        .post('/http-public/create')
        .send({ create: { title: 'To Delete With Token' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`);
      await request(app.getHttpServer())
        .delete(`/http-public/remove/${created.body.id}`)
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACCOUNT — token required, NO row scoping (sees all records)
  // ═══════════════════════════════════════════════════════════
  describe('account level', () => {
    it('find without token → 401', async () => {
      await request(app.getHttpServer())
        .get('/http-account/find')
        .expect(401);
    });

    it('find with alice → 200 (sees ALL records)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-account/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('findOne with alice on bob record → 200 (no scoping)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-account/find/3')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(+res.body.id).toBe(3);
    });

    it('create without token → 401', async () => {
      await request(app.getHttpServer())
        .post('/http-account/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('create with alice → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-account/create')
        .send({ create: { title: 'Account Created' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);
      expect(res.body.title).toBe('Account Created');
    });

    it('update other user record with alice → 200 (no scoping)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-account/update/3')
        .send({ update: { title: 'Account Updated Bob' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Account Updated Bob');
    });

    it('update without token → 401', async () => {
      await request(app.getHttpServer())
        .patch('/http-account/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('remove without token → 401', async () => {
      await request(app.getHttpServer())
        .delete('/http-account/remove/999')
        .expect(401);
    });

    it('remove with alice → 200 (success, no scoping)', async () => {
      const created = await request(app.getHttpServer())
        .post('/http-account/create')
        .send({ create: { title: 'Account To Delete' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);
      const res = await request(app.getHttpServer())
        .delete(`/http-account/remove/${created.body.id}`)
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.text).toContain('true');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // OWNER — token required, row-scoped to caller's records
  // ═══════════════════════════════════════════════════════════
  describe('owner level', () => {
    it('find without token → 401', async () => {
      await request(app.getHttpServer())
        .get('/http-owner/find')
        .expect(401);
    });

    it('find with alice → 200 (only own records)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-owner/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
    });

    it('find with admin → 200 (all records, superuser bypass)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-owner/find')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('findOne own with alice → 200', async () => {
      await request(app.getHttpServer())
        .get('/http-owner/find/1')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
    });

    it('findOne not-owned with alice → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-owner/find/3')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(404);
    });

    it('findOne not-owned with admin → 200 (bypass)', async () => {
      await request(app.getHttpServer())
        .get('/http-owner/find/3')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
    });

    it('self with alice → 200 (only own)', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-owner/self')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.length).toBe(2);
    });

    it('create without token → 401', async () => {
      await request(app.getHttpServer())
        .post('/http-owner/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('create with alice → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-owner/create')
        .send({ create: { title: 'Owner Created' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);
      expect(res.body.title).toBe('Owner Created');
    });

    it('update without token → 401', async () => {
      await request(app.getHttpServer())
        .patch('/http-owner/update/2')
        .send({ update: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('update own with alice → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-owner/update/2')
        .send({ update: { title: 'Owner Updated Own' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Owner Updated Own');
    });

    it('update not-owned with alice → 404', async () => {
      await request(app.getHttpServer())
        .patch('/http-owner/update/3')
        .send({ update: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(404);
    });

    it('update not-owned with admin → 200 (bypass)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-owner/update/3')
        .send({ update: { title: 'Admin Updated' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Admin Updated');
    });

    it('remove without token → 401', async () => {
      await request(app.getHttpServer())
        .delete('/http-owner/remove/3')
        .expect(401);
    });

    it('remove not-owned with alice → 200 but false', async () => {
      const res = await request(app.getHttpServer())
        .delete('/http-owner/remove/3')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.text).toContain('false');
    });

    it('remove own with alice → 200 true', async () => {
      const created = await request(app.getHttpServer())
        .post('/http-owner/create')
        .send({ create: { title: 'To Delete Owner' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/http-owner/remove/${created.body.id}`)
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(200);
      expect(res.text).toContain('true');
    });

    it('remove not-owned with bob → 200 but false', async () => {
      const res = await request(app.getHttpServer())
        .delete('/http-owner/remove/1')
        .set('Authorization', `Bearer ${BOB_TOKEN}`)
        .expect(200);
      expect(res.text).toContain('false');
    });

    it('remove not-owned with admin → 200 true (bypass)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/http-owner/remove/3')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.text).toContain('true');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ADMIN — token required + isSuperuser
  // (read=public, create/update/delete=admin)
  // ═══════════════════════════════════════════════════════════
  describe('admin level', () => {
    it('find without token → 200 (read is public)', async () => {
      await request(app.getHttpServer())
        .get('/http-admin/find')
        .expect(200);
    });

    it('create without token → 401', async () => {
      await request(app.getHttpServer())
        .post('/http-admin/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('create with non-superuser → 403', async () => {
      await request(app.getHttpServer())
        .post('/http-admin/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('create with superuser → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-admin/create')
        .send({ create: { title: 'Admin Created' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(201);
      expect(res.body.title).toBe('Admin Created');
    });

    it('update without token → 401', async () => {
      await request(app.getHttpServer())
        .patch('/http-admin/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('update with non-superuser → 403', async () => {
      await request(app.getHttpServer())
        .patch('/http-admin/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('update with superuser → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-admin/update/1')
        .send({ update: { title: 'Admin Updated' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Admin Updated');
    });

    it('remove without token → 401', async () => {
      await request(app.getHttpServer())
        .delete('/http-admin/remove/999')
        .expect(401);
    });

    it('remove with non-superuser → 403', async () => {
      await request(app.getHttpServer())
        .delete('/http-admin/remove/999')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('remove with superuser → 200', async () => {
      const created = await request(app.getHttpServer())
        .post('/http-admin/create')
        .send({ create: { title: 'Admin To Delete' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

      await request(app.getHttpServer())
        .delete(`/http-admin/remove/${created.body.id}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ADMIN-STRICT — all operations = admin (including read)
  // ═══════════════════════════════════════════════════════════
  describe('admin-strict level (read=admin)', () => {
    it('find without token → 401', async () => {
      await request(app.getHttpServer())
        .get('/http-admin-strict/find')
        .expect(401);
    });

    it('find with non-superuser → 403', async () => {
      await request(app.getHttpServer())
        .get('/http-admin-strict/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('find with superuser → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-admin-strict/find')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CLOSED — routes do not exist
  // ═══════════════════════════════════════════════════════════
  describe('closed level', () => {
    it('find without token → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-closed/find')
        .expect(404);
    });

    it('find with regular user → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-closed/find')
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(404);
    });

    it('findOne without token → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-closed/find/1')
        .expect(404);
    });

    it('find with admin → 404', async () => {
      await request(app.getHttpServer())
        .get('/http-closed/find')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });

    it('create without token → 404', async () => {
      await request(app.getHttpServer())
        .post('/http-closed/create')
        .send({ create: { title: 'Nope' }, relations: [] })
        .expect(404);
    });

    it('create with admin → 404', async () => {
      await request(app.getHttpServer())
        .post('/http-closed/create')
        .send({ create: { title: 'Nope' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });

    it('update without token → 404', async () => {
      await request(app.getHttpServer())
        .patch('/http-closed/update/1')
        .send({ update: { title: 'Nope' }, relations: [] })
        .expect(404);
    });

    it('update with admin → 404', async () => {
      await request(app.getHttpServer())
        .patch('/http-closed/update/1')
        .send({ update: { title: 'Nope' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });

    it('remove with admin → 404', async () => {
      await request(app.getHttpServer())
        .delete('/http-closed/remove/1')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // MIXED — read=public, create=owner, update=admin, delete=closed
  // ═══════════════════════════════════════════════════════════
  describe('mixed level', () => {
    it('find without token → 200 (public read)', async () => {
      await request(app.getHttpServer())
        .get('/http-mixed/find')
        .expect(200);
    });

    it('create without token → 401 (owner create)', async () => {
      await request(app.getHttpServer())
        .post('/http-mixed/create')
        .send({ create: { title: 'Hack' }, relations: [] })
        .expect(401);
    });

    it('create with alice → 201 (owner create)', async () => {
      const res = await request(app.getHttpServer())
        .post('/http-mixed/create')
        .send({ create: { title: 'Mixed Created' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(201);
      expect(res.body.title).toBe('Mixed Created');
    });

    it('update with alice → 403 (admin update)', async () => {
      await request(app.getHttpServer())
        .patch('/http-mixed/update/1')
        .send({ update: { title: 'Hack' }, relations: [] })
        .set('Authorization', `Bearer ${ALICE_TOKEN}`)
        .expect(403);
    });

    it('update with admin → 200 (admin update)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/http-mixed/update/1')
        .send({ update: { title: 'Mixed Admin Updated' }, relations: [] })
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);
      expect(res.body.title).toBe('Mixed Admin Updated');
    });

    it('remove with admin → 404 (closed delete)', async () => {
      await request(app.getHttpServer())
        .delete('/http-mixed/remove/1')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(404);
    });
  });
});
