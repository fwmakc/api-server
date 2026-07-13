import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestUserService } from '../services';

describe('csv + countDistinct', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;
  let userService: TestUserService;
  const tmpDir = join(__dirname, '..', '..', '..', 'test-tmp-csv');

  beforeAll(async () => {
    process.env.UPLOADS_PATH = tmpDir;
    process.env.UPLOADS_URL = '/uploads';

    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
    userService = moduleRef.get(TestUserService);
  });

  afterAll(async () => {
    await moduleRef.close();
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('countDistinct', () => {
    it('CD1: countDistinct on auth across articles', async () => {
      const result = await articleService.countDistinct('auth_id', {});
      expect(result).toBe(2);
    });

    it('CD2: countDistinct on email across users', async () => {
      const result = await userService.countDistinct('email', {});
      expect(result).toBeGreaterThanOrEqual(2);
    });
  });

  describe('csv export', () => {
    it('CSV1: exports articles to csv file', async () => {
      const result = await articleService.csv(
        { relations: [{ name: 'auth' }] },
        'articles_export',
      );

      expect(result.success).toBe(true);
      expect(result.entries).toBe(3);
      expect(result.url).toContain('articles_export');
      expect(result.url).toContain('.csv');

      const dir = join(tmpDir, 'csv');
      const files = readdirSync(dir).filter((f) =>
        f.startsWith('articles_export'),
      );
      expect(files.length).toBe(1);

      const content = readFileSync(join(dir, files[0]), 'utf-8');
      expect(content).toContain('title');
      expect(content).toContain('Alice Post 1');
    }, 15000);
  });
});
