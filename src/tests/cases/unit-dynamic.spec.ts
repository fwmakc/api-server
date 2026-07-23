process.env.DB_TYPE = 'postgres';

describe('Unit — dynamic SQL services', () => {
  describe('dynamic.where.service — parseDynamicWhereObject', () => {
    let parseDynamicWhereObject: any;

    beforeAll(async () => {
      ({ parseDynamicWhereObject } = await import(
        'api-server-toolkit'
      ));
    });

    it('D1: null where returns empty array', () => {
      expect(parseDynamicWhereObject(null)).toEqual([]);
    });

    it('D2: simple equality', () => {
      const [clause] = parseDynamicWhereObject({ name: 'test' });
      expect(clause).toBe(`"name" = 'test'`);
    });

    it('D3: number value (not quoted)', () => {
      const [clause] = parseDynamicWhereObject({ count: 42 });
      expect(clause).toBe(`"count" = 42`);
    });

    it('D4: null value generates IS NULL', () => {
      const [clause] = parseDynamicWhereObject({ bio: null });
      expect(clause).toBe(`"bio" IS NULL`);
    });

    it('D5: "like" modifier uses ILIKE for postgres', () => {
      const [clause] = parseDynamicWhereObject({ 'name.like': '%test%' });
      expect(clause).toBe(`"name" ILIKE '%test%'`);
    });

    it('D6: "not" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'name.not': 'test' });
      expect(clause).toBe(`"name" != 'test'`);
    });

    it('D7: "not.like" chained modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'name.not.like': '%test%' });
      expect(clause).toBe(`"name" NOT ILIKE '%test%'`);
    });

    it('D8: "in" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.in': [1, 2, 3] });
      expect(clause).toBe(`"id" IN (1,2,3)`);
    });

    it('D9: "not.in" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.not.in': [1, 2] });
      expect(clause).toBe(`"id" NOT IN (1,2)`);
    });

    it('D10: "between" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.between': [1, 10] });
      expect(clause).toBe(`"id" BETWEEN (1,10)`);
    });

    it('D11: "less" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.less': 5 });
      expect(clause).toBe(`"id" < 5`);
    });

    it('D12: "lessOrEqual" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.lessOrEqual': 5 });
      expect(clause).toBe(`"id" <= 5`);
    });

    it('D13: "more" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.more': 5 });
      expect(clause).toBe(`"id" > 5`);
    });

    it('D14: "moreOrEqual" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.moreOrEqual': 5 });
      expect(clause).toBe(`"id" >= 5`);
    });

    it('D15: "not.more" generates <=', () => {
      const [clause] = parseDynamicWhereObject({ 'id.not.more': 5 });
      expect(clause).toBe(`"id" <= 5`);
    });

    it('D16: "null" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'bio.null': true });
      expect(clause).toBe(`"bio" IS NULL`);
    });

    it('D17: "not.null" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'bio.not.null': true });
      expect(clause).toBe(`"bio" IS NOT NULL`);
    });

    it('D18: "boolean" modifier — true', () => {
      const [clause] = parseDynamicWhereObject({ 'active.boolean': 'true' });
      expect(clause).toBe(`"active" = TRUE`);
    });

    it('D19: "boolean" modifier — false', () => {
      const [clause] = parseDynamicWhereObject({ 'active.boolean': 'false' });
      expect(clause).toBe(`"active" = FALSE`);
    });

    it('D20: "number" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'count.number': '42' });
      expect(clause).toBe(`"count" = 42`);
    });

    it('D21: "string" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'name.string': 'test' });
      expect(clause).toBe(`"name" = 'test'`);
    });

    it('D22: "search" modifier — tokenized ILIKE', () => {
      const [clause] = parseDynamicWhereObject({
        'name.search': 'hello world',
      });
      expect(clause).toBe(
        `("name" ILIKE '%hello%') AND ("name" ILIKE '%world%')`,
      );
    });

    it('D23: "empty" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'bio.empty': true });
      expect(clause).toBe(`"bio" IS NULL AND "bio" = ''`);
    });

    it('D24: "and" combinator with "like"', () => {
      const [clause] = parseDynamicWhereObject({
        'name.and.like': ['%foo%', '%bar%'],
      });
      expect(clause).toBe(
        `(("name" ILIKE '%foo%') and ("name" ILIKE '%bar%'))`,
      );
    });

    it('D25: "or" combinator with "like"', () => {
      const [clause] = parseDynamicWhereObject({
        'name.or.like': ['%foo%', '%bar%'],
      });
      expect(clause).toBe(`(("name" ILIKE '%foo%') or ("name" ILIKE '%bar%'))`);
    });

    it('D26: multiple conditions in single where', () => {
      const clauses = parseDynamicWhereObject({
        name: 'test',
        'id.more': 5,
      });
      expect(clauses.length).toBe(2);
      expect(clauses).toContain(`"name" = 'test'`);
      expect(clauses).toContain(`"id" > 5`);
    });

    it('D27: "any" modifier', () => {
      const [clause] = parseDynamicWhereObject({ 'id.any': [1, 2] });
      expect(clause).toBe(`"id" ANY (1,2)`);
    });

    it('D28: skips nested object values', () => {
      const clauses = parseDynamicWhereObject({
        name: 'test',
        nested: { foo: 'bar' },
      });
      expect(clauses.length).toBe(1);
    });
  });

  describe('dynamic.save.service — parseDynamicSaveObject', () => {
    let parseDynamicSaveObject: any;

    beforeAll(async () => {
      ({ parseDynamicSaveObject } = await import(
        'api-server-toolkit'
      ));
    });

    it('S1: string value — quoted and escaped', () => {
      const result = parseDynamicSaveObject({ name: 'hello' });
      expect(result.name).toBe(`'hello'`);
    });

    it('S2: null value — NULL', () => {
      const result = parseDynamicSaveObject({ bio: null });
      expect(result.bio).toBe('NULL');
    });

    it('S3: undefined value — skipped', () => {
      const result = parseDynamicSaveObject({ name: 'test', skip: undefined });
      expect(result).not.toHaveProperty('skip');
      expect(result.name).toBe(`'test'`);
    });

    it('S4: number value — as-is', () => {
      const result = parseDynamicSaveObject({ count: 42 });
      expect(result.count).toBe(42);
    });

    it('S5: object value — JSON with quotes escaped', () => {
      const result = parseDynamicSaveObject({ data: { key: "val'ue" } });
      expect(result.data).toContain(`'`);
      expect(result.data).toContain('key');
      expect(result.data).toContain(`val''ue`);
    });

    it('S6: string with single quote — escaped', () => {
      const result = parseDynamicSaveObject({ name: "O'Brien" });
      expect(result.name).toBe(`'O''Brien'`);
    });

    it('S7: ISO date string — formatted', () => {
      const result = parseDynamicSaveObject({
        created: '2024-01-15T10:30:00.000Z',
      });
      expect(result.created).toMatch(/'2024-01-15/);
      expect(result.created).toMatch(/\d{2}:\d{2}:\d{2}'/);
    });

    it('S8: empty string — empty quotes', () => {
      const result = parseDynamicSaveObject({ name: '' });
      expect(result.name).toBe(`''`);
    });

    it('S9: boolean true — as-is (number)', () => {
      const result = parseDynamicSaveObject({ active: true });
      expect(result.active).toBe(true);
    });

    it('S10: array value — JSON serialized', () => {
      const result = parseDynamicSaveObject({ tags: ['a', 'b'] });
      expect(result.tags).toContain(`'`);
      expect(result.tags).toContain('a');
      expect(result.tags).toContain('b');
    });
  });

  describe('param_symbol.service — prepareParams', () => {
    it('P1: postgres uses $1, $2, ...', async () => {
      process.env.DB_TYPE = 'postgres';
      jest.resetModules();
      const { prepareParams } = await import(
        'api-server-toolkit'
      );
      const result = prepareParams({ name: 'test', count: 1 }) as any;
      expect(result.name).toBe('$1');
      expect(result.count).toBe('$2');
    });

    it('P2: mysql uses ?', async () => {
      process.env.DB_TYPE = 'mysql';
      jest.resetModules();
      const { prepareParams } = await import(
        'api-server-toolkit'
      );
      const result = prepareParams({ name: 'test', count: 1 }) as any;
      expect(result.name).toBe('?');
      expect(result.count).toBe('?');
    });

    afterAll(() => {
      process.env.DB_TYPE = 'postgres';
    });
  });

  describe('cookie.service — Cookie class', () => {
    let Cookie: any;
    let mockRequest: any;
    let mockResponse: any;

    beforeAll(async () => {
      ({ Cookie } = await import('api-server-toolkit'));
    });

    beforeEach(() => {
      mockRequest = {
        cookies: {},
      };
      mockResponse = {
        cookies: {},
        cookie(name: string, value: any, options: any) {
          mockResponse.cookies[name] = { value, options };
        },
        clearCookie(name: string) {
          delete mockResponse.cookies[name];
          delete mockRequest.cookies[name];
        },
      };
    });

    it('C1: set stores cookie', () => {
      const cookie = new Cookie(mockRequest, mockResponse);
      cookie.set('token', 'abc123');
      expect(mockResponse.cookies.token).toBeDefined();
      expect(mockResponse.cookies.token.value).toBe('abc123');
      expect(mockResponse.cookies.token.options.httpOnly).toBe(true);
    });

    it('C2: get reads cookie', () => {
      mockRequest.cookies.token = 'abc123';
      const cookie = new Cookie(mockRequest, mockResponse);
      expect(cookie.get('token')).toBe('abc123');
    });

    it('C3: get returns undefined for missing cookie', () => {
      const cookie = new Cookie(mockRequest, mockResponse);
      expect(cookie.get('nonexistent')).toBeUndefined();
    });

    it('C4: setJson stores JSON cookie', () => {
      const cookie = new Cookie(mockRequest, mockResponse);
      cookie.setJson('data', { key: 'value' });
      expect(mockResponse.cookies.data.value).toBe(
        JSON.stringify({ key: 'value' }),
      );
    });

    it('C5: getJson parses JSON cookie', () => {
      mockRequest.cookies.data = JSON.stringify({ foo: 'bar' });
      const cookie = new Cookie(mockRequest, mockResponse);
      expect(cookie.getJson('data')).toEqual({ foo: 'bar' });
    });

    it('C6: getJson returns null for missing', () => {
      const cookie = new Cookie(mockRequest, mockResponse);
      expect(cookie.getJson('missing')).toBeNull();
    });

    it('C7: reset clears cookie', () => {
      mockRequest.cookies.token = 'abc123';
      mockResponse.cookies.token = { value: 'abc123' };
      const cookie = new Cookie(mockRequest, mockResponse);
      cookie.reset('token');
      expect(mockRequest.cookies.token).toBeUndefined();
    });

    it('C8: set then get roundtrip', () => {
      const cookie = new Cookie(mockRequest, mockResponse);
      cookie.set('session', 'xyz');
      mockRequest.cookies.session = 'xyz';
      expect(cookie.get('session')).toBe('xyz');
    });
  });
});