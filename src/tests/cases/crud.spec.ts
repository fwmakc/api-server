import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('CRUD — CommonService basics', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('P2: findOne returns entity by id', async () => {
    const result = await service.findOne({ id: 1 });
    expect(result).toBeDefined();
    expect(+result.id).toBe(1);
    expect(result.title).toBe('Alice Post 1');
  });

  it('P3: find returns all seeded articles', async () => {
    const result = await service.find();
    expect(result.length).toBe(3);
  });

  it('P4: find with where filter', async () => {
    const result = await service.find({ where: { title: 'Alice Post 1' } });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Alice Post 1');
  });

  it('P5: find with limit and offset', async () => {
    const result = await service.find({
      limit: 2,
      offset: 1,
      order: { id: 'ASC' },
    });
    expect(result.length).toBe(2);
    expect(+result[0].id).toBe(2);
    expect(+result[1].id).toBe(3);
  });

  it('P6: find with order DESC', async () => {
    const result = await service.find({ order: { id: 'DESC' } });
    expect(+result[0].id).toBe(3);
    expect(+result[2].id).toBe(1);
  });

  it('P9: count articles by owner', async () => {
    const result = await service.count({ where: { account: { id: 1 } } });
    expect(result).toBe(2);
  });

  it('P1: create returns entity with generated id', async () => {
    const result = await service.create({ title: 'New Article' } as any);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe('New Article');
  });

  it('P7: update returns entity with updated field', async () => {
    const result = await service.update(1, { title: 'Updated Title' } as any);
    expect(result).toBeDefined();
    expect(result.title).toBe('Updated Title');
  });

  it('P8: remove deletes entity', async () => {
    const created = await service.create({ title: 'To Delete' } as any);
    const removed = await service.remove(created.id);
    expect(removed).toBe(true);
    const found = await service.findOne({ id: created.id });
    expect(found).toBeUndefined();
  });
});
