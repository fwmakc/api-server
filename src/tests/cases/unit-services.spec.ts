import { ILike, Like } from 'typeorm';

describe('Unit — utility services', () => {
  describe('like.service — prepareLike / prepareLikeOrm', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('U1: prepareLikeOrm returns ILike for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareLikeOrm } = require('@src/common/service/like.service');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(ILike('%test%'));
      delete process.env.DB_TYPE;
    });

    it('U2: prepareLikeOrm returns Like for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareLikeOrm } = require('@src/common/service/like.service');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(Like('%test%'));
      delete process.env.DB_TYPE;
    });

    it('U3: prepareLikeOrm returns Like when DB_TYPE unset', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      delete process.env.DB_TYPE;
      const { prepareLikeOrm } = require('@src/common/service/like.service');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(Like('%test%'));
    });

    it('U4: prepareLike returns ILIKE string for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareLike } = require('@src/common/service/like.service');
      expect(prepareLike()).toBe('ILIKE');
      delete process.env.DB_TYPE;
    });

    it('U5: prepareLike returns LIKE string for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareLike } = require('@src/common/service/like.service');
      expect(prepareLike()).toBe('LIKE');
      delete process.env.DB_TYPE;
    });
  });

  describe('quotes.service — prepareQuotes', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('U6: returns backtick for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareQuotes } = require('@src/common/service/quotes.service');
      expect(prepareQuotes()).toBe('`');
      delete process.env.DB_TYPE;
    });

    it('U7: returns double-quote for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareQuotes } = require('@src/common/service/quotes.service');
      expect(prepareQuotes()).toBe('"');
      delete process.env.DB_TYPE;
    });

    it('U8: DB_QUOTES env overrides DB_TYPE', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      process.env.DB_QUOTES = '`';
      const { prepareQuotes } = require('@src/common/service/quotes.service');
      expect(prepareQuotes()).toBe('`');
      delete process.env.DB_TYPE;
      delete process.env.DB_QUOTES;
    });

    it('U9: returns undefined when neither set', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      delete process.env.DB_TYPE;
      delete process.env.DB_QUOTES;
      const { prepareQuotes } = require('@src/common/service/quotes.service');
      expect(prepareQuotes()).toBeUndefined();
    });
  });

  describe('crypt.service — encrypt / decrypt / hash', () => {
    const hexKey = '00112233445566778899aabbccddeeff';

    beforeAll(() => {
      process.env.AES_SECRET = hexKey;
    });

    afterAll(() => {
      delete process.env.AES_SECRET;
    });

    it('U10: encrypt returns object with encrypted and iv hex strings', async () => {
      const { encrypt } = await import('@src/common/service/crypt.service');
      const result = await encrypt('hello world');
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.iv.length).toBe(24);
    });

    it('U11: decrypt reverses encrypt', async () => {
      const { encrypt, decrypt } = await import('@src/common/service/crypt.service');
      const original = 'secret data 123';
      const { encrypted, iv } = await encrypt(original);
      const decrypted = await decrypt(encrypted, iv);
      expect(decrypted).toBe(original);
    });

    it('U12: decrypt with wrong iv throws', async () => {
      const { encrypt, decrypt } = await import('@src/common/service/crypt.service');
      const { encrypted } = await encrypt('test data');
      const badIv = '000000000000000000000000';
      await expect(decrypt(encrypted, badIv)).rejects.toThrow();
    });

    it('U13: hash returns consistent hex digest', async () => {
      const { hash } = await import('@src/common/service/crypt.service');
      const h1 = hash('test');
      const h2 = hash('test');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[0-9a-f]{32}$/);
    });

    it('U14: hash with different algorithm', async () => {
      const { hash } = await import('@src/common/service/crypt.service');
      const h = hash('test', 'sha256');
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });

    it('U15: different inputs produce different hashes', async () => {
      const { hash } = await import('@src/common/service/crypt.service');
      expect(hash('a')).not.toBe(hash('b'));
    });

    it('U16: encrypt handles unicode', async () => {
      const { encrypt, decrypt } = await import('@src/common/service/crypt.service');
      const original = 'Привет мир 🌍';
      const { encrypted, iv } = await encrypt(original);
      const decrypted = await decrypt(encrypted, iv);
      expect(decrypted).toBe(original);
    });
  });

  describe('bind.service — bind()', () => {
    it('U17: extracts id from entity with default key', async () => {
      const { bind } = await import('@src/common/service/bind.service');
      const entity = { id: 42, name: 'test' };
      const result = bind(entity, { allow: true });
      expect(result.id).toBe(42);
      expect(result.key).toBe('id');
      expect(result.name).toBe('auth');
      expect(result.allow).toBe(true);
    });

    it('U18: extracts field by custom key', async () => {
      const { bind } = await import('@src/common/service/bind.service');
      const entity = { id: 1, email: 'user@test' };
      const result = bind(entity, { allow: false, key: 'email', name: 'owner' });
      expect(result.id).toBe('user@test');
      expect(result.key).toBe('email');
      expect(result.name).toBe('owner');
      expect(result.allow).toBe(false);
    });

    it('U19: handles null entity gracefully', async () => {
      const { bind } = await import('@src/common/service/bind.service');
      const result = bind(null, { allow: true });
      expect(result.id).toBeUndefined();
      expect(result.key).toBe('id');
      expect(result.name).toBe('auth');
    });

    it('U20: passes through undefined allow as undefined', async () => {
      const { bind } = await import('@src/common/service/bind.service');
      const result = bind({ id: 1 }, {} as any);
      expect(result.allow).toBeUndefined();
    });
  });
});
