import { DataSource } from 'typeorm';
import { compileRuleToBind, matchRule } from 'api-server-toolkit';
import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestSoftService } from '../services';

/**
 * Кейсы self-pentest (волна 4): семантика bind'а после фиксов —
 * compileRuleToBind (rule.filter + явный bind для scope-all), delete-гварды
 * (tenant-бинды проверяются наравне с owner), restore (includeDeleted)
 * и штампы скоупа в range-сдвиге movePosition.
 */
describe('Access bind semantics (pentest fixes)', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleService: TestArticleService;
  let softService: TestSoftService;
  let dataSource: DataSource;

  const anon = { roles: ['public'] } as any;
  const alice = { id: 1, roles: ['user'] } as any;
  const aliceBind = { id: 1, name: 'account', key: 'id', allow: false } as any;
  const tenantBind = (id: number) =>
    ({ tenantId: id, tenantName: 'account', tenantKey: 'id', allow: false }) as any;

  beforeAll(async () => {
    moduleRef = await createTestModule();
    articleService = moduleRef.get(TestArticleService);
    softService = moduleRef.get(TestSoftService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('BIND-1: rule.filter travels into the bind — anonymous find sees only filtered rows', async () => {
    // Раньше: scope 'all' давал undefined → сервисный дефолт {allow:true},
    // а filter вообще не компилился → аноним читал ВСЮ таблицу.
    const bind = compileRuleToBind(
      matchRule(
        [
          { who: ['public'], filter: { title: 'Alice Post 1' } },
          { who: ['authenticated'] },
        ],
        anon,
      ),
      anon,
    );
    expect(bind?.allow).toBeUndefined();
    expect(bind?.filter).toEqual({ title: 'Alice Post 1' });

    const rows: any[] = await articleService.find({}, bind as any);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Alice Post 1');
  });

  it('BIND-2: scope-all match gives an explicit bind — field response rules apply', async () => {
    const bind = compileRuleToBind(
      matchRule([{ who: ['authenticated'] }], alice),
      alice,
    );
    expect(bind?.allow).toBeUndefined();

    const rows: any[] = await articleService.find({ where: { id: 1 } }, bind as any);
    expect(rows[0].title).toBe('Alice Post 1');
    // secretNotes: response только для editor/superuser — вырезан по bind.roles
    expect(rows[0].secretNotes).toBeUndefined();

    // контрольный: allow-бинд (доверенный вызов) поле видит
    const allowed: any[] = await articleService.find(
      { where: { id: 1 } },
      { allow: true } as any,
    );
    expect(allowed[0].secretNotes).toBe('alice secret 1');
  });

  it('BIND-3: tenant-scoped user cannot remove another tenant row', async () => {
    const created = await articleService.create(
      { title: 'Tenant Target' } as any,
      undefined,
      aliceBind,
    );

    // чужой тенант (account.id = 2): remove раньше пропускал tenant-бинд → delete по id
    expect(await articleService.remove(created.id, tenantBind(2))).toBe(false);
    const still = await dataSource.query(
      'SELECT id FROM test_articles WHERE id = $1',
      [created.id],
    );
    expect(still).toHaveLength(1);

    // свой тенант — удаляется (у articles нет soft-delete колонки → hard delete)
    expect(await articleService.remove(created.id, tenantBind(1))).toBe(true);
    const gone = await dataSource.query(
      'SELECT id FROM test_articles WHERE id = $1',
      [created.id],
    );
    expect(gone).toHaveLength(0);
  });

  it('BIND-4: tenant-scoped user cannot hard-delete another tenant row', async () => {
    const created = await articleService.create(
      { title: 'Hard Tenant Target' } as any,
      undefined,
      aliceBind,
    );

    expect(await articleService.hardDelete(created.id, tenantBind(2))).toBe(false);
    const still = await dataSource.query(
      'SELECT id FROM test_articles WHERE id = $1',
      [created.id],
    );
    expect(still).toHaveLength(1);

    expect(await articleService.hardDelete(created.id, tenantBind(1))).toBe(true);
  });

  it('BIND-5: owner can restore own soft-deleted row (includeDeleted scope check)', async () => {
    const created = await softService.create(
      { title: 'Restore Me' } as any,
      undefined,
      aliceBind,
    );

    expect(await softService.remove(created.id, aliceBind)).toBe(true);
    const deleted = await dataSource.query(
      'SELECT deleted_at FROM test_softs WHERE id = $1',
      [created.id],
    );
    expect(deleted[0].deleted_at).not.toBeNull();

    // Раньше guard искал строку с deleted_at IS NULL и всегда отвечал false
    expect(await softService.restore(created.id, aliceBind)).toBe(true);
    const restored = await dataSource.query(
      'SELECT deleted_at FROM test_softs WHERE id = $1',
      [created.id],
    );
    expect(restored[0].deleted_at).toBeNull();
  });

  it('BIND-6: movePosition shifts only rows inside the bind scope', async () => {
    // Seed: art1 (alice, pos 1), art2 (alice, pos 2), art3 (BOB, pos 1).
    // Перенос alice-строки с 3 на 1 сдвигает диапазон [1..3) вверх.
    // Без штампа owner в range-update art3 (bob, pos 1) уехала бы на 2.
    const target = await articleService.create(
      { title: 'Alice Move Target', position: 3 } as any,
      undefined,
      aliceBind,
    );
    expect(
      await articleService.movePosition(target.id, 'position', 1, aliceBind),
    ).toBe(true);

    const positions = await dataSource.query(
      'SELECT id, position FROM test_articles WHERE id = ANY($1)',
      [[1, 2, 3, target.id]],
    );
    const byId = new Map(
      positions.map((r: any) => [Number(r.id), Number(r.position)]),
    );
    expect(byId.get(Number(target.id))).toBe(1);
    expect(byId.get(1)).toBe(2); // art1 alice — сдвинута
    expect(byId.get(2)).toBe(3); // art2 alice — сдвинута
    expect(byId.get(3)).toBe(1); // art3 BOB — не тронута
  });
});
