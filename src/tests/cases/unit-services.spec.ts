/* eslint-disable @typescript-eslint/no-var-requires */
import { ILike, Like } from 'typeorm';

describe('Unit — utility services', () => {
  describe('like.service — prepareLike / prepareLikeOrm', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('U1: prepareLikeOrm returns ILike for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareLikeOrm } = require('@core/common');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(ILike('%test%'));
      delete process.env.DB_TYPE;
    });

    it('U2: prepareLikeOrm returns Like for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareLikeOrm } = require('@core/common');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(Like('%test%'));
      delete process.env.DB_TYPE;
    });

    it('U3: prepareLikeOrm returns Like when DB_TYPE unset', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      delete process.env.DB_TYPE;
      const { prepareLikeOrm } = require('@core/common');
      const result = prepareLikeOrm('%test%');
      expect(result).toEqual(Like('%test%'));
    });

    it('U4: prepareLike returns ILIKE string for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareLike } = require('@core/common');
      expect(prepareLike()).toBe('ILIKE');
      delete process.env.DB_TYPE;
    });

    it('U5: prepareLike returns LIKE string for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareLike } = require('@core/common');
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
      const { prepareQuotes } = require('@core/common');
      expect(prepareQuotes()).toBe('`');
      delete process.env.DB_TYPE;
    });

    it('U7: returns double-quote for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareQuotes } = require('@core/common');
      expect(prepareQuotes()).toBe('"');
      delete process.env.DB_TYPE;
    });

    it('U8: DB_QUOTES env overrides DB_TYPE', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      process.env.DB_QUOTES = '`';
      const { prepareQuotes } = require('@core/common');
      expect(prepareQuotes()).toBe('`');
      delete process.env.DB_TYPE;
      delete process.env.DB_QUOTES;
    });

    it('U9: returns undefined when neither set', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      delete process.env.DB_TYPE;
      delete process.env.DB_QUOTES;
      const { prepareQuotes } = require('@core/common');
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
      const { encrypt } = await import('@core/common');
      const result = await encrypt('hello world');
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.iv.length).toBe(24);
    });

    it('U11: decrypt reverses encrypt', async () => {
      const { encrypt, decrypt } = await import(
        '@core/common'
      );
      const original = 'secret data 123';
      const { encrypted, iv } = await encrypt(original);
      const decrypted = await decrypt(encrypted, iv);
      expect(decrypted).toBe(original);
    });

    it('U12: decrypt with wrong iv throws', async () => {
      const { encrypt, decrypt } = await import(
        '@core/common'
      );
      const { encrypted } = await encrypt('test data');
      const badIv = '000000000000000000000000';
      await expect(decrypt(encrypted, badIv)).rejects.toThrow();
    });

    it('U13: hash returns consistent hex digest', async () => {
      const { hash } = await import('@core/common');
      const h1 = hash('test');
      const h2 = hash('test');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[0-9a-f]{32}$/);
    });

    it('U14: hash with different algorithm', async () => {
      const { hash } = await import('@core/common');
      const h = hash('test', 'sha256');
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });

    it('U15: different inputs produce different hashes', async () => {
      const { hash } = await import('@core/common');
      expect(hash('a')).not.toBe(hash('b'));
    });

    it('U16: encrypt handles unicode', async () => {
      const { encrypt, decrypt } = await import(
        '@core/common'
      );
      const original = 'Привет мир 🌍';
      const { encrypted, iv } = await encrypt(original);
      const decrypted = await decrypt(encrypted, iv);
      expect(decrypted).toBe(original);
    });
  });

  describe('bind.service — bind()', () => {
    it('U17: extracts id from entity with default key', async () => {
      const { bind } = await import('@core/common');
      const entity = { id: 42, name: 'test' };
      const result = bind(entity, { allow: true });
      expect(result.id).toBe(42);
      expect(result.key).toBe('id');
      expect(result.name).toBe('account');
      expect(result.allow).toBe(true);
    });

    it('U18: extracts field by custom key', async () => {
      const { bind } = await import('@core/common');
      const entity = { id: 1, email: 'user@test' };
      const result = bind(entity, {
        allow: false,
        key: 'email',
        name: 'owner',
      });
      expect(result.id).toBe('user@test');
      expect(result.key).toBe('email');
      expect(result.name).toBe('owner');
      expect(result.allow).toBe(false);
    });

    it('U19: handles null entity gracefully', async () => {
      const { bind } = await import('@core/common');
      const result = bind(null, { allow: true });
      expect(result.id).toBeUndefined();
      expect(result.key).toBe('id');
      expect(result.name).toBe('account');
    });

    it('U20: passes through undefined allow as undefined', async () => {
      const { bind } = await import('@core/common');
      const result = bind({ id: 1 }, {} as any);
      expect(result.allow).toBeUndefined();
    });
  });

  describe('scalar.helper — isFilled', () => {
    it('U21: returns false for empty string', () => {
      const { isFilled } = require('@core/common');
      expect(isFilled('')).toBe(false);
    });

    it('U22: returns false for null and undefined', () => {
      const { isFilled } = require('@core/common');
      expect(isFilled(null)).toBe(false);
      expect(isFilled(undefined)).toBe(false);
    });

    it('U23: returns true for non-empty values', () => {
      const { isFilled } = require('@core/common');
      expect(isFilled('text')).toBe(true);
      expect(isFilled(0)).toBe(true);
      expect(isFilled(false)).toBe(true);
    });
  });

  describe('array.helper — arrayWrap / arrayUnwrap', () => {
    it('U24: arrayWrap wraps single value', () => {
      const { arrayWrap } = require('@core/common');
      expect(arrayWrap(42)).toEqual([42]);
    });

    it('U25: arrayWrap returns array as-is', () => {
      const { arrayWrap } = require('@core/common');
      expect(arrayWrap([1, 2])).toEqual([1, 2]);
    });

    it('U26: arrayUnwrap extracts first element', () => {
      const { arrayUnwrap } = require('@core/common');
      expect(arrayUnwrap([1, 2])).toBe(1);
    });

    it('U27: arrayUnwrap returns non-array as-is', () => {
      const { arrayUnwrap } = require('@core/common');
      expect(arrayUnwrap(42)).toBe(42);
    });
  });

  describe('object.helper — except / only', () => {
    it('U28: except removes specified keys', () => {
      const { except } = require('@core/common');
      expect(except({ a: 1, b: 2, c: 3 }, 'b')).toEqual({ a: 1, c: 3 });
    });

    it('U29: except accepts array of keys', () => {
      const { except } = require('@core/common');
      expect(except({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 });
    });

    it('U30: only keeps specified keys', () => {
      const { only } = require('@core/common');
      expect(only({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('string.helper — stripHtmlTags', () => {
    it('U31: strips simple HTML tags', () => {
      const { stripHtmlTags } = require('@core/common');
      const result = stripHtmlTags('<p>Hello</p>');
      expect(result.trim()).toBe('Hello');
    });

    it('U32: converts <br> to newline', () => {
      const { stripHtmlTags } = require('@core/common');
      expect(stripHtmlTags('Line 1<br>Line 2')).toBe('Line 1\nLine 2');
    });

    it('U33: returns empty string for falsy input', () => {
      const { stripHtmlTags } = require('@core/common');
      expect(stripHtmlTags('')).toBe('');
      expect(stripHtmlTags(null)).toBe('');
    });
  });

  describe('json.service — prepareJsonOrm', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('U34: returns JsonContains for postgres', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'postgres';
      const { prepareJsonOrm } = require('@core/common');
      const result = prepareJsonOrm({ key: 'value' });
      expect(result).toBeDefined();
      expect((result as any)._type).toBe('jsonContains');
      delete process.env.DB_TYPE;
    });

    it('U35: returns Raw for mysql', () => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      process.env.DB_TYPE = 'mysql';
      const { prepareJsonOrm } = require('@core/common');
      const result = prepareJsonOrm({ key: 'value' });
      expect(result).toBeDefined();
      expect((result as any)._type).toBe('raw');
      delete process.env.DB_TYPE;
    });

    it('U36: returns undefined for non-object value', () => {
      const { prepareJsonOrm } = require('@core/common');
      expect(prepareJsonOrm('string')).toBeUndefined();
      expect(prepareJsonOrm(42)).toBeUndefined();
    });
  });
});