import { DataSource } from 'typeorm';
import { createTestModule } from '../app.testingModule';
import { DynamicTestService } from '../services';

describe('DynamicService — CRUD on table with runtime-defined columns', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let service: DynamicTestService;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    service = moduleRef.get(DynamicTestService);
    dataSource = moduleRef.get(DataSource);

    await dataSource.query(`
      ALTER TABLE test_dynamic
        ADD COLUMN title VARCHAR(255) DEFAULT '',
        ADD COLUMN priority INTEGER DEFAULT 0,
        ADD COLUMN active BOOLEAN DEFAULT true,
        ADD COLUMN account_id INTEGER DEFAULT NULL;
    `);

    await dataSource.query(`
      INSERT INTO test_dynamic (title, priority, active, account_id) VALUES
        ('Alpha', 10, true, 1),
        ('Beta',  20, true, 1),
        ('Gamma', 30, false, 2);
    `);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('DI2: find all — returns 3 records with dynamic columns', async () => {
    const result: any[] = await service.find({});
    expect(result.length).toBe(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].priority).toBeDefined();
    expect(result[0].active).toBeDefined();
  });

  it('DI3: find with WHERE on dynamic column', async () => {
    const result: any[] = await service.find({ where: { title: 'Beta' } });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Beta');
  });

  it('DI4: find with ORDER on dynamic column', async () => {
    const result: any[] = await service.find({ order: { priority: 'DESC' } });
    expect(+result[0].priority).toBe(30);
    expect(+result[1].priority).toBe(20);
    expect(+result[2].priority).toBe(10);
  });

  it('DI5: find with LIMIT/OFFSET', async () => {
    const result: any[] = await service.find({
      order: { priority: 'ASC' },
      limit: 2,
      offset: 1,
    });
    expect(result.length).toBe(2);
    expect(+result[0].priority).toBe(20);
    expect(+result[1].priority).toBe(30);
  });

  it('DI1: create — INSERT with dynamic columns', async () => {
    const result: any = await service.create({
      title: 'Delta',
      priority: 40,
      active: true,
      account_id: 1,
    } as any);
    expect(result).toBeDefined();
    expect(result.title).toBe('Delta');
    expect(+result.priority).toBe(40);
  });

  it('DI6: update — UPDATE dynamic column', async () => {
    const created: any = await service.create({
      title: 'ToUpdate',
      priority: 5,
      active: true,
    } as any);
    const updated: any = await service.update(+created.id, {
      priority: 99,
    } as any);
    expect(updated).toBeDefined();
    expect(+updated.priority).toBe(99);
  });

  it('DI7: findOne — inherited, calls DynamicService.find()', async () => {
    const created: any = await service.create({
      title: 'ForFindOne',
      priority: 50,
    } as any);
    const result: any = await service.findOne({ id: +created.id });
    expect(result).toBeDefined();
    expect(result.title).toBe('ForFindOne');
  });

  it('DI8: remove — DELETE by id', async () => {
    const created: any = await service.create({
      title: 'ToDelete',
      priority: 1,
    } as any);
    const ok = await service.remove(+created.id);
    expect(ok).toBe(true);
    const gone: any = await service.findOne({ id: +created.id });
    expect(gone).toBeUndefined();
  });

  it('DI11: find with bind — filter by account_id', async () => {
    const result: any[] = await service.find(
      {},
      { id: 1, name: 'account_id', key: 'id', allow: false },
    );
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every((r) => +r.account_id === 1)).toBe(true);
  });

  it('DI9: runtime ADD COLUMN → CRUD with new column', async () => {
    await dataSource.query(
      `ALTER TABLE test_dynamic ADD COLUMN tags JSON DEFAULT NULL;`,
    );

    const created: any = await service.create({
      title: 'WithTags',
      priority: 60,
      tags: { color: 'red', label: 'urgent' },
    } as any);
    expect(created).toBeDefined();
    expect(created.tags).toBeDefined();

    const found: any = await service.findOne({ id: +created.id });
    expect(found.tags).toBeDefined();
    const tags =
      typeof found.tags === 'string' ? JSON.parse(found.tags) : found.tags;
    expect(tags.color).toBe('red');

    await dataSource.query(`ALTER TABLE test_dynamic DROP COLUMN tags;`);
  });

  it('DI10: after DROP COLUMN — column absent from results', async () => {
    const result: any[] = await service.find({ where: { title: 'Alpha' } });
    expect(result.length).toBe(1);
    expect(result[0].tags).toBeUndefined();
  });
});
