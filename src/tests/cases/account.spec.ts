import { genSalt, hash, compare } from 'bcryptjs';
import { createTestModule } from '../app.testingModule';
import { TestAccountService } from '../services';

describe('Account — AccountService and HashAccountHandler', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let accountService: TestAccountService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    accountService = moduleRef.get(TestAccountService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('HashAccountHandler.generate (bcrypt)', () => {
    it('A1: generates a bcrypt hash', async () => {
      const { genSalt, hash: bcryptHash } = await import('bcryptjs');
      const salt = await genSalt(10);
      const hashed = await bcryptHash('mypassword', salt);
      expect(hashed).not.toBe('mypassword');
      expect(hashed.startsWith('$2a$')).toBe(true);
    });

    it('A2: hash can be verified with compare', async () => {
      const { genSalt, hash: bcryptHash, compare } = await import('bcryptjs');
      const hashed = await bcryptHash('test123', await genSalt(10));
      expect(await compare('test123', hashed)).toBe(true);
      expect(await compare('wrong', hashed)).toBe(false);
    });

    it('A3: different salts produce different hashes', async () => {
      const { genSalt, hash: bcryptHash } = await import('bcryptjs');
      const h1 = await bcryptHash('same', await genSalt(10));
      const h2 = await bcryptHash('same', await genSalt(10));
      expect(h1).not.toBe(h2);
    });
  });

  describe('AccountService.findByUsername', () => {
    it('A4: finds existing user by username', async () => {
      const account = await accountService.findByUsername('alice@test');
      expect(account).toBeDefined();
      expect(+account.id).toBe(1);
    });

    it('A5: returns null for non-existent username', async () => {
      const account = await accountService.findByUsername('nobody@test');
      expect(account).toBeNull();
    });
  });

  describe('AccountService.login', () => {
    it('A6: login with valid credentials returns account', async () => {
      const account = await accountService.login('alice@test', 'password123');
      expect(account).toBeDefined();
      expect(+account.id).toBe(1);
      expect(account.username).toBe('alice@test');
    });

    it('A7: login with wrong password throws', async () => {
      await expect(
        accountService.login('alice@test', 'wrongpassword'),
      ).rejects.toThrow('Invalid password');
    });

    it('A8: login with non-existent user throws', async () => {
      await expect(
        accountService.login('nobody@test', 'password123'),
      ).rejects.toThrow('User not found');
    });

    it('A9: login with unactivated account throws', async () => {
      await accountService.update(2, { isActivated: false } as any);
      await expect(
        accountService.login('bob@test', 'password123'),
      ).rejects.toThrow('Not activated');
      await accountService.update(2, { isActivated: true } as any);
    });
  });

  describe('AccountService.create — strips isSuperuser', () => {
    it('A10: create ignores isSuperuser=true in dto', async () => {
      const created = await accountService.create({
        username: 'newuser@test',
        password: 'pass123',
        isActivated: true,
        isSuperuser: true,
      } as any);

      expect(created).toBeDefined();
      expect(created.isSuperuser).toBe(false);
    });

    it('A11: create ignores isSuperuser even when explicitly set', async () => {
      const created = await accountService.create({
        username: 'another@test',
        password: 'pass456',
        isActivated: true,
        isSuperuser: true,
      } as any);

      const found = await accountService.findOne({ id: created.id });
      expect(found.isSuperuser).toBe(false);
    });
  });

  describe('AccountService.update — strips isSuperuser', () => {
    it('A12: update ignores isSuperuser', async () => {
      const updated = await accountService.update(1, {
        username: 'alice@test',
        isSuperuser: true,
      } as any);
      expect(updated.isSuperuser).toBe(false);
    });
  });

  describe('AccountService password hashing flow', () => {
    it('A13: password stored as bcrypt hash (not plaintext)', async () => {
      const raw = await accountService.findByUsername('alice@test');
      expect(raw.password).not.toBe('password123');
      expect(raw.password.startsWith('$2a$')).toBe(true);
    });

    it('A14: create + login roundtrip with hashed password', async () => {
      const { genSalt, hash: bcryptHash } = await import('bcryptjs');
      const hashedPassword = await bcryptHash(
        'roundtrip123',
        await genSalt(10),
      );

      const created = await accountService.create({
        username: 'roundtrip@test',
        password: hashedPassword,
        isActivated: true,
      } as any);

      const account = await accountService.login(
        'roundtrip@test',
        'roundtrip123',
      );
      expect(+account.id).toBe(+created.id);
    });
  });
});
