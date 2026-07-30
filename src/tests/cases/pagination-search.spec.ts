import { DataSource } from 'typeorm';
import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';
import { TestArticleEntity } from '../entities';
import { SearchType } from 'api-server-toolkit';

describe('Pagination + Search + Count — bug verification', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  const TOTAL = 120;

  const adminBind = { allow: true };
  const aliceBind = { id: 1, name: 'account', key: 'id', allow: false };

  const searchAlpha: SearchType = { fields: ['title'], terms: ['alpha'], method: undefined };
  const searchBeta: SearchType = { fields: ['title'], terms: ['beta'], method: undefined };
  const searchGamma: SearchType = { fields: ['title'], terms: ['gamma'], method: undefined };
  const searchAlphaAndBeta: SearchType = {
    fields: ['title'],
    terms: ['alpha', 'beta'],
    method: 'and',
  };
  const searchAlphaOrBeta: SearchType = {
    fields: ['title'],
    terms: ['alpha', 'beta'],
    method: 'or',
  };
  const searchMultiField: SearchType = {
    fields: ['title', 'content'],
    terms: ['alpha'],
    method: undefined,
  };

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);

    const ds = moduleRef.get(DataSource);
    const articleRepo = ds.getRepository(TestArticleEntity);
    const accountRepo = ds.getRepository('TestAccountEntity');

    await articleRepo.query('DELETE FROM test_articles CASCADE');

    const alice = await accountRepo.findOneBy({ id: 1 });
    const bob = await accountRepo.findOneBy({ id: 2 });

    const articles: TestArticleEntity[] = [];
    for (let i = 1; i <= TOTAL; i++) {
      const m = i % 4;
      let title: string;
      let content: string;

      if (m === 1) {
        title = `Alpha Article ${i}`;
        content = `Alpha content ${i}`;
      } else if (m === 2) {
        title = `Beta Article ${i}`;
        content = `Beta content ${i}`;
      } else if (m === 3) {
        title = `Alpha Beta Article ${i}`;
        content = `Alpha Beta content ${i}`;
      } else {
        title = `Gamma Article ${i}`;
        content = `Gamma content ${i}`;
      }

      articles.push(
        articleRepo.create({
          id: i,
          title,
          content,
          account: i <= 60 ? alice : bob,
          position: i,
          createdAt: new Date(2024, 0, 1, Math.floor((i - 1) / 60), (i - 1) % 60, 0),
        }),
      );
    }

    await articleRepo.save(articles);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ─────────────────────────────────────────────
  // Group 1: Control — pagination without search
  // These should PASS — proving the basic mechanism works
  // ─────────────────────────────────────────────
  describe('Group 1: Control — pagination without search', () => {
    it('P1: basic first page — limit=10, offset=0', async () => {
      const result = await service.find({ limit: 10, offset: 0 }, adminBind);
      expect(result.length).toBe(10);
    });

    it('P2: last partial page — limit=10, offset=115', async () => {
      const result = await service.find({ limit: 10, offset: 115 }, adminBind);
      expect(result.length).toBe(5);
    });

    it('P3: count all articles — no filters', async () => {
      const result = await service.count({}, adminBind);
      expect(result).toBe(TOTAL);
    });

    it('P1b: count for alice only — bind scoping', async () => {
      const result = await service.count({}, aliceBind);
      expect(result).toBe(60);
    });
  });

  // ─────────────────────────────────────────────
  // Group 2: BUG — search applied after DB LIMIT/OFFSET
  //
  // searchService runs in JS AFTER the DB query already applied
  // take/skip. This means each page returns fewer results than limit,
  // because non-matching rows are loaded then discarded.
  // ─────────────────────────────────────────────
  describe('Group 2: BUG — search applied after pagination', () => {
    it('P4: search "alpha" + limit=10 returns fewer than 10', async () => {
      const result = await service.find(
        { search: searchAlpha, limit: 10, offset: 0 },
        adminBind,
      );
      // 60 of 120 articles match "alpha". Page 1 should return 10.
      // BUG: DB returns IDs 1-10 (5 match "alpha"), search filters to 5.
      expect(result.length).toBe(10); // FAILS: actual 5
    });

    it('P5: pagination based on count misses half the results', async () => {
      const total = await service.count(
        { search: searchAlpha },
        adminBind,
      );
      // count() calls find() without limit → loads all 120 → filters to 60
      // So count is "correct" (60), but pages based on it are wrong:
      const pages = Math.ceil(total / 10); // 6 pages
      const allIds = new Set<number>();
      for (let p = 0; p < pages; p++) {
        const page = await service.find(
          { search: searchAlpha, limit: 10, offset: p * 10 },
          adminBind,
        );
        page.forEach((r) => allIds.add(+r.id));
      }
      // User expects to see all 60 matching articles across 6 pages.
      // BUG: each page returns ~5 instead of 10, so only ~30 are collected.
      expect(allIds.size).toBe(60); // FAILS: actual ~30
    });

    it('P6: search "alpha" last page — limit=10, offset=50', async () => {
      const result = await service.find(
        { search: searchAlpha, limit: 10, offset: 50 },
        adminBind,
      );
      // 60 matches, page 6 (offset=50) should return last 10.
      // BUG: DB returns IDs 51-60 of ALL articles, search finds ~5.
      expect(result.length).toBe(10); // FAILS: actual 5
    });

    it('P13: search "alpha" middle page — limit=10, offset=30', async () => {
      const result = await service.find(
        { search: searchAlpha, limit: 10, offset: 30 },
        adminBind,
      );
      // Page 4 of 6 — should return 10 alpha articles.
      // BUG: DB returns IDs 31-40, search finds ~5.
      expect(result.length).toBe(10); // FAILS: actual 5
    });

    it('P14: search "gamma" first page — limit=10, offset=0', async () => {
      const result = await service.find(
        { search: searchGamma, limit: 10, offset: 0 },
        adminBind,
      );
      // 30 gamma articles exist (IDs 4,8,12,...,120).
      // BUG: DB returns IDs 1-10, only 2 match "gamma" (IDs 4, 8).
      expect(result.length).toBe(10); // FAILS: actual 2
    });

    it('P15: search AND "alpha"+"beta" + limit=5', async () => {
      const result = await service.find(
        { search: searchAlphaAndBeta, limit: 5, offset: 0 },
        adminBind,
      );
      // 30 Alpha Beta articles exist. Page 1 should return 5.
      // BUG: DB returns IDs 1-5 (A,B,AB,G,A), only 1 matches both terms.
      expect(result.length).toBe(5); // FAILS: actual 1
    });

    it('P21: search "gamma" with large limit (50) still misses', async () => {
      const result = await service.find(
        { search: searchGamma, limit: 50, offset: 0 },
        adminBind,
      );
      // 30 gamma articles exist. limit=50 should return all 30.
      // BUG: DB returns IDs 1-50, only ~12 match "gamma" (IDs 4,8,12,...,48).
      expect(result.length).toBe(30); // FAILS: actual ~12
    });
  });

  // ─────────────────────────────────────────────
  // Group 3: BUG — count issues
  //
  // Bug A: count() sets select:{id:true}, stripping title → searchService can't match.
  // Bug B: count with limit returns page count, not total.
  // Bug C: count loads ALL rows into memory (performance).
  // Bug D: HTTP count endpoint doesn't accept search param (design bug).
  // ─────────────────────────────────────────────
  describe('Group 3: BUG — count issues', () => {
    it('P7: count with search returns 0 — select:{id:true} strips searchable fields', async () => {
      const result = await service.count(
        { search: searchAlpha },
        adminBind,
      );
      // count() does: find.select = { id: true }, then calls find().
      // find() loads rows with only { id } — no title field!
      // searchService tries extractValues(result, ['title']) → null → no match.
      // BUG: returns 0 instead of 60.
      expect(result).toBe(60); // FAILS: actual 0
    });

    it('P8: count with limit returns page count instead of total', async () => {
      const result = await service.count(
        { limit: 10, offset: 0 },
        adminBind,
      );
      // BUG: count passes limit to find(), DB returns 10 rows, count returns 10.
      expect(result).toBe(120); // FAILS: actual 10
    });

    it('P9: count with limit and search — triple bug', async () => {
      const result = await service.count(
        { search: searchAlpha, limit: 10 },
        adminBind,
      );
      // BUG: select strips title → search finds nothing (0), limit caps at 10.
      // Returns 0 instead of 60.
      expect(result).toBe(60); // FAILS: actual 0
    });

    it('P19: count with bind + search — alice "alpha" (select bug)', async () => {
      const result = await service.count(
        { search: searchAlpha },
        aliceBind,
      );
      // Same select bug as P7: title stripped, search finds nothing.
      // BUG: returns 0 instead of 30.
      expect(result).toBe(30); // FAILS: actual 0
    });
  });

  // ─────────────────────────────────────────────
  // Group 4: BUG — sort + search interaction
  //
  // ORDER BY is applied at SQL level on ALL rows.
  // searchService then filters in JS.
  // Without pagination: sort order happens to be correct.
  // With pagination: sort + offset produces wrong rows + wrong order.
  // ─────────────────────────────────────────────
  describe('Group 4: BUG — sort + search interaction', () => {
    it('P10: search + sort DESC + limit=10 returns 0 (DESC puts Gamma first)', async () => {
      const result = await service.find(
        {
          search: searchAlpha,
          order: { title: 'DESC' },
          limit: 10,
          offset: 0,
        },
        adminBind,
      );
      // Should return 10 alpha articles sorted by title DESC.
      // BUG: DESC puts Gamma > Beta > Alpha. DB returns 10 Gamma articles,
      // none match "alpha" → search returns 0.
      expect(result.length).toBe(10); // FAILS: actual 0
    });

    it('P11: search + sort ASC without pagination — order correct?', async () => {
      const result = await service.find(
        {
          search: searchAlpha,
          order: { title: 'ASC' },
        },
        adminBind,
      );
      // Without limit, all 120 loaded, sorted by DB, filtered to 60.
      // The 60 alpha matches retain their relative sort order.
      // This ACCIDENTALLY works — but only because there's no pagination.
      expect(result.length).toBe(60);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].title >= result[i - 1].title).toBe(true);
      }
    });

    it('P18: search + sort createdAt DESC + limit=10 + offset=20', async () => {
      const result = await service.find(
        {
          search: searchAlpha,
          order: { createdAt: 'DESC' },
          limit: 10,
          offset: 20,
        },
        adminBind,
      );
      // Page 3 of alpha sorted by date — should return 10.
      // BUG: DB skips 20 of ALL articles sorted by date, returns next 10,
      // search filters to ~5.
      expect(result.length).toBe(10); // FAILS: actual ~5
    });

    it('P20: search + sort title ASC + limit=10 — verify ordering', async () => {
      const result = await service.find(
        {
          search: searchAlpha,
          order: { title: 'ASC' },
          limit: 10,
        },
        adminBind,
      );
      // First 10 alpha articles by title ASC.
      // BUG: returns ~5 instead of 10. But those 5 ARE correctly sorted.
      expect(result.length).toBe(10); // FAILS: actual ~5
      // Verify sort order of whatever we got
      for (let i = 1; i < result.length; i++) {
        expect(result[i].title >= result[i - 1].title).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────
  // Group 5: BUG — bind + search + pagination
  // ─────────────────────────────────────────────
  describe('Group 5: BUG — bind + search + pagination', () => {
    it('P12: alice + search "alpha" + limit=10', async () => {
      const result = await service.find(
        { search: searchAlpha, limit: 10, offset: 0 },
        aliceBind,
      );
      // Alice has 60 articles, 30 match "alpha". Page 1 should return 10.
      // BUG: DB returns alice's IDs 1-10 (bind in SQL ✅), search finds ~5.
      expect(result.length).toBe(10); // FAILS: actual 5
    });

    it('P12b: alice + search "alpha" — all results correct without pagination', async () => {
      const result = await service.find(
        { search: searchAlpha },
        aliceBind,
      );
      // Without limit: all alice's 60 loaded, filtered to 30. Correct.
      expect(result.length).toBe(30);
      // All should belong to alice
      expect(result.every((r) => +r.account.id === 1)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // Group 6: BUG — multi-term / multi-field search
  // ─────────────────────────────────────────────
  describe('Group 6: BUG — multi-term / multi-field search', () => {
    it('P16: search OR "alpha"|"beta" + limit=10', async () => {
      const result = await service.find(
        { search: searchAlphaOrBeta, limit: 10, offset: 0 },
        adminBind,
      );
      // 90 of 120 match OR. Page 1 should return 10.
      // BUG: DB returns IDs 1-10 (8 match OR), search returns 8.
      expect(result.length).toBe(10); // FAILS: actual 8
    });

    it('P17: multi-field search title+content "alpha" + limit=10', async () => {
      const result = await service.find(
        { search: searchMultiField, limit: 10, offset: 0 },
        adminBind,
      );
      // Same 60 articles match (alpha in title AND content).
      // BUG: same as P4 — DB returns 10, search finds 5.
      expect(result.length).toBe(10); // FAILS: actual 5
    });

    it('P22: search "beta" + limit=10 + offset=70', async () => {
      const result = await service.find(
        { search: searchBeta, limit: 10, offset: 70 },
        adminBind,
      );
      // 60 beta articles exist. offset=70 is page 8 (beyond 6 expected pages).
      // In correct behavior: offset=70 is past the last page → 0 results.
      // But count says 60, so user calculates 6 pages and never reaches offset=70.
      // In buggy behavior: DB returns IDs 71-80 of all 120, ~5 match "beta".
      // The user gets unexpected results on a page they shouldn't have queried.
      // This test proves offset is relative to unfiltered data, not search results.
      const allBeta = await service.find({ search: searchBeta }, adminBind);
      const expectedPages = Math.ceil(allBeta.length / 10); // 6
      // User would never query offset=70 based on count
      // But if they did (e.g., infinite scroll), they'd get ghost results:
      expect(result.length).toBe(0); // FAILS: actual ~5 (ghost page)
    });
  });

  // ─────────────────────────────────────────────
  // Group 7: Cross-page consistency
  // ─────────────────────────────────────────────
  describe('Group 7: BUG — cross-page consistency', () => {
    it('P23: paginate through ALL DB rows for "alpha" — no duplicates, correct total', async () => {
      // Paginate through ALL 120 DB rows (12 pages of 10) collecting alpha matches
      const allIds = new Set<number>();
      const allResults: any[] = [];

      for (let p = 0; p < 12; p++) {
        const page = await service.find(
          { search: searchAlpha, limit: 10, offset: p * 10 },
          adminBind,
        );
        page.forEach((r) => {
          allIds.add(+r.id);
          allResults.push(r);
        });
      }

      // Should find all 60 alpha articles across 12 DB pages
      expect(allIds.size).toBe(60); // PASS — traversing all DB rows finds everything
      // No duplicates
      expect(allResults.length).toBe(60); // PASS — each ID appears once

      // BUT: user would need 12 pages, not 6 (count/limit).
      // Each page returns ~5 instead of 10.
    });

    it('P24: count-based pagination loses results (the real-world bug)', async () => {
      // Simulate a frontend: fetch count, calculate pages, paginate
      // Note: count with search is broken (returns 0 due to select bug),
      // so we use the known total to prove the pagination bug independently.
      const total = 60; // Known: 60 articles match "alpha"
      const pageSize = 10;
      const expectedPages = Math.ceil(total / pageSize); // 6

      const collected = new Set<number>();
      for (let p = 0; p < expectedPages; p++) {
        const page = await service.find(
          { search: searchAlpha, limit: pageSize, offset: p * pageSize },
          adminBind,
        );
        page.forEach((r) => collected.add(+r.id));
      }

      // Frontend expects to collect all 60 items across 6 pages.
      // BUG: each page returns ~5 not 10, so only ~30 collected.
      expect(collected.size).toBe(60); // FAILS: actual ~30
    });
  });
});
