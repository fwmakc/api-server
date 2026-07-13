import { genSalt, hash, compare } from 'bcryptjs';
import { createTestModule } from '../app.testingModule';
import { TestAuthService } from '../services';

describe('Auth — AuthService and HashAuthHandler', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let authService: TestAuthService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    authService = moduleRef.get(TestAuthService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('HashAuthHandler.generate (bcrypt)', () => {
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

  describe('AuthService.findByUsername', () => {
    it('A4: finds existing user by username', async () => {
      const auth = await authService.findByUsername('alice@test');
      expect(auth).toBeDefined();
      expect(+auth.id).toBe(1);
    });

    it('A5: returns null for non-existent username', async () => {
      const auth = await authService.findByUsername('nobody@test');
      expect(auth).toBeNull();
    });
  });

  describe('AuthService.login', () => {
    it('A6: login with valid credentials returns auth', async () => {
      const auth = await authService.login('alice@test', 'password123');
      expect(auth).toBeDefined();
      expect(+auth.id).toBe(1);
      expect(auth.username).toBe('alice@test');
    });

    it('A7: login with wrong password throws', async () => {
      await expect(
        authService.login('alice@test', 'wrongpassword'),
      ).rejects.toThrow('Invalid password');
    });

    it('A8: login with non-existent user throws', async () => {
      await expect(
        authService.login('nobody@test', 'password123'),
      ).rejects.toThrow('User not found');
    });

    it('A9: login with unactivated account throws', async () => {
      await authService.update(2, { isActivated: false } as any);
      await expect(
        authService.login('bob@test', 'password123'),
      ).rejects.toThrow('Not activated');
      await authService.update(2, { isActivated: true } as any);
    });
  });

  describe('AuthService.create — strips isSuperuser', () => {
    it('A10: create ignores isSuperuser=true in dto', async () => {
      const created = await authService.create({
        username: 'newuser@test',
        password: 'pass123',
        isActivated: true,
        isSuperuser: true,
      } as any);

      expect(created).toBeDefined();
      expect(created.isSuperuser).toBe(false);
    });

    it('A11: create ignores isSuperuser even when explicitly set', async () => {
      const created = await authService.create({
        username: 'another@test',
        password: 'pass456',
        isActivated: true,
        isSuperuser: true,
      } as any);

      const found = await authService.findOne({ id: created.id });
      expect(found.isSuperuser).toBe(false);
    });
  });

  describe('AuthService.update — strips isSuperuser', () => {
    it('A12: update ignores isSuperuser', async () => {
      const updated = await authService.update(1, {
        username: 'alice@test',
        isSuperuser: true,
      } as any);
      expect(updated.isSuperuser).toBe(false);
    });
  });

  describe('AuthService password hashing flow', () => {
    it('A13: password stored as bcrypt hash (not plaintext)', async () => {
      const raw = await authService.findByUsername('alice@test');
      expect(raw.password).not.toBe('password123');
      expect(raw.password.startsWith('$2a$')).toBe(true);
    });

    it('A14: create + login roundtrip with hashed password', async () => {
      const { genSalt, hash: bcryptHash } = await import('bcryptjs');
      const hashedPassword = await bcryptHash(
        'roundtrip123',
        await genSalt(10),
      );

      const created = await authService.create({
        username: 'roundtrip@test',
        password: hashedPassword,
        isActivated: true,
      } as any);

      const auth = await authService.login('roundtrip@test', 'roundtrip123');
      expect(+auth.id).toBe(+created.id);
    });
  });
});
