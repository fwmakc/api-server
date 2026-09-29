import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  BOB_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

describe('HTTP Field Rules — stripping via interceptor', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createHttpTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('HFA1: public find without token → secretNotes stripped for all', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeUndefined();
    });
  });

  it('HFA2: public find with editor → secretNotes visible (who-only rules)', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeDefined();
    });
  });

  it('HFA2a: public find with plain user → secretNotes stripped', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .set('Authorization', `Bearer ${BOB_TOKEN}`)
      .expect(200);

    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeUndefined();
    });
  });

  it('HFA3: public find with editor + relations → secretNotes on all articles', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .query({ relations: JSON.stringify([{ name: 'account' }]) })
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeDefined();
    });
  });

  it('HFA4: owner findOne own article → secretNotes visible', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-owner/find/1')
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    expect(res.body.secretNotes).toBeDefined();
  });

  it('HFA5: admin find → secretNotes visible for all articles', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .expect(200);

    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeDefined();
    });
  });

  it('HFA6: owner create strips write:admin and write:closed fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/http-owner/create')
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .send({
        create: {
          title: 'FA Create Test',
          content: 'content',
          secretNotes: 'alice notes',
          adminNotes: 'should be stripped',
          lockedNotes: 'also stripped',
          position: 99,
        },
        relations: [{ name: 'account' }],
      })
      .expect(201);

    expect(res.body.title).toBe('FA Create Test');
    expect(res.body.secretNotes).toBe('alice notes');
    expect(res.body.adminNotes).toBeFalsy();
    expect(res.body.lockedNotes).toBeFalsy();
  });

  it('HFA7: admin create allows write:admin but strips write:closed', async () => {
    const res = await request(app.getHttpServer())
      .post('/http-admin/create')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        create: {
          title: 'Admin Create',
          content: 'content',
          adminNotes: 'admin sets this',
          lockedNotes: 'always stripped',
          position: 98,
        },
      })
      .expect(201);

    expect(res.body.title).toBe('Admin Create');
    expect(res.body.adminNotes).toBe('admin sets this');
    // Суперюзер — глобальный байпас: closed-поля для него не стрипаются.
    expect(res.body.lockedNotes).toBe('always stripped');
  });

  it('HFA8: owner update strips write:admin and write:closed fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/http-owner/update/1')
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .send({
        update: {
          title: 'Updated by Alice',
          secretNotes: 'updated notes',
          adminNotes: 'injected via update',
          lockedNotes: 'locked via update',
        },
        relations: [{ name: 'account' }],
      })
      .expect(200);

    expect(res.body.title).toBe('Updated by Alice');
    expect(res.body.secretNotes).toBe('updated notes');
    expect(res.body.adminNotes).not.toBe('injected via update');
    expect(res.body.lockedNotes).not.toBe('locked via update');
  });

  it('HFA9: nested relation fields stripped by roles (comments.authorIp)', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .query({
        relations: JSON.stringify([
          { name: 'account' },
          { name: 'comments' },
          { name: 'comments.account' },
        ]),
      })
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    const art1 = res.body.find((a: any) => +a.id === 1);
    expect(art1.comments).toBeDefined();
    expect(art1.comments.length).toBe(2);

    art1.comments.forEach((comment: any) => {
      expect(comment.authorIp).toBeDefined();
    });

    const resBob = await request(app.getHttpServer())
      .get('/http-public/find')
      .query({
        relations: JSON.stringify([{ name: 'account' }, { name: 'comments' }]),
      })
      .set('Authorization', `Bearer ${BOB_TOKEN}`)
      .expect(200);

    const bobArt1 = resBob.body.find((a: any) => +a.id === 1);
    bobArt1.comments.forEach((comment: any) => {
      expect(comment.authorIp).toBeUndefined();
    });
  });

  it('HFA10: admin update allows write:admin, strips write:closed', async () => {
    const res = await request(app.getHttpServer())
      .patch('/http-admin/update/1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        update: {
          title: 'Admin Updated',
          adminNotes: 'admin sets via update',
          lockedNotes: 'always stripped',
        },
      })
      .expect(200);

    expect(res.body.title).toBe('Admin Updated');
    expect(res.body.adminNotes).toBe('admin sets via update');
    // Суперюзер — глобальный байпас: closed-поля для него не стрипаются.
    expect(res.body.lockedNotes).toBe('always stripped');
  });
});
