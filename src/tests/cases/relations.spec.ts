import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('Relations — eager/lazy loading', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P22: findOne with account relation', async () => {
    const result = await service.findOne({
      id: 1,
      relations: [{ name: 'account' }],
    });
    expect(result).toBeDefined();
    expect(result.account).toBeDefined();
    expect(result.account.username).toBe('alice@test');
  });

  it('P23: findOne with comments relation (OneToMany)', async () => {
    const result = await service.findOne({
      id: 1,
      relations: [{ name: 'comments' }],
    });
    expect(result).toBeDefined();
    expect(result.comments).toBeDefined();
    expect(result.comments.length).toBe(2);
  });

  it('P24: findOne with tags relation (ManyToMany)', async () => {
    const result = await service.findOne({
      id: 1,
      relations: [{ name: 'tags' }],
    });
    expect(result).toBeDefined();
    expect(result.tags).toBeDefined();
    expect(result.tags.length).toBe(1);
    expect(result.tags[0].name).toBe('news');
  });

  it('P25: findOne with multiple relations', async () => {
    const result = await service.findOne({
      id: 1,
      relations: [{ name: 'account' }, { name: 'comments' }, { name: 'tags' }],
    });
    expect(result).toBeDefined();
    expect(result.account).toBeDefined();
    expect(result.comments.length).toBe(2);
    expect(result.tags.length).toBe(1);
  });
});
