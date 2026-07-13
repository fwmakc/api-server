import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('Setup verification', () => {
  it('should create test module and seed 3 articles', async () => {
    const moduleRef = await createTestModule();
    const service = moduleRef.get(TestArticleService);
    const articles = await service.find();
    expect(articles.length).toBe(3);
    await moduleRef.close();
  });
});
