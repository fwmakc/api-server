import { createTestModule } from '../app.testingModule';
import { TestArticleService } from '../services';

describe('SQL injection in sortPosition / movePosition field names', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: TestArticleService;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(TestArticleService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N1: sortPosition with malicious field name → rejected', async () => {
    await expect(
      service.sortPosition("'; DROP TABLE test_articles;--", {}),
    ).rejects.toThrow('Invalid field name');

    const all = await service.find({});
    expect(all.length).toBe(3);
  });

  it('N2: sortPosition by primary key → rejected', async () => {
    await expect(service.sortPosition('id', {})).rejects.toThrow('primary key');
  });

  it('N3: movePosition with raw SQL in field name → rejected', async () => {
    await expect(
      service.movePosition(1, 'position; DROP TABLE test_articles;--', 2),
    ).rejects.toThrow('Invalid field name');

    const all = await service.find({});
    expect(all.length).toBe(3);
  });

  it('N4: sortPosition with malformed field name → rejected', async () => {
    await expect(service.sortPosition('position} HACK {', {})).rejects.toThrow(
      'Invalid field name',
    );

    const all = await service.find({});
    expect(all.length).toBe(3);
  });

  it('N5: sortPosition with unknown field → rejected', async () => {
    await expect(service.sortPosition('nonexistent', {})).rejects.toThrow(
      'Unknown field',
    );
  });

  it('N6: sortPosition with valid field → success', async () => {
    const result = await service.sortPosition('position', {});
    expect(result).toBe(true);
  });
});
