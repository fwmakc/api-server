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
});
