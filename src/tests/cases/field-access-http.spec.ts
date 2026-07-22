import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createHttpTestApp,
  ALICE_TOKEN,
  ADMIN_TOKEN,
} from '../http.testingModule';

describe('HTTP Field Access — @FieldAccess via interceptor', () => {
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

  it('HFA2: public find with alice but no relations → secretNotes stripped (cannot verify ownership)', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    res.body.forEach((article: any) => {
      expect(article.secretNotes).toBeUndefined();
    });
  });

  it('HFA3: public find with alice + account relation → secretNotes only on own articles', async () => {
    const res = await request(app.getHttpServer())
      .get('/http-public/find')
      .query({ relations: JSON.stringify([{ name: 'account' }]) })
      .set('Authorization', `Bearer ${ALICE_TOKEN}`)
      .expect(200);

    const aliceArticles = res.body.filter((a: any) => +a.id === 1 || +a.id === 2);
    const bobArticle = res.body.find((a: any) => +a.id === 3);

    aliceArticles.forEach((article: any) => {
      expect(article.secretNotes).toBeDefined();
    });
    expect(bobArticle.secretNotes).toBeUndefined();
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
    expect(res.body.lockedNotes).toBeFalsy();
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

  it('HFA9: nested relation fields stripped by interceptor (comments.authorIp)', async () => {
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

    const ownComment = art1.comments.find((c: any) => +c.id === 1);
    expect(ownComment.authorIp).toBeDefined();

    const otherComment = art1.comments.find((c: any) => +c.id === 2);
    expect(otherComment.authorIp).toBeUndefined();
  });
});
