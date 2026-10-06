import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../../account/account.entity';
import {
  runBackfill,
  fetchAllAccounts,
} from '../../scripts/backfill-accounts';

const ID = 980001;

function page(items: Array<[number, string, boolean]>) {
  return {
    items: items.map(([id, username, isActivated]) => ({
      id,
      username,
      isActivated,
    })),
  };
}

describe('scripts/backfill-accounts', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'root',
          password: process.env.DB_PASSWORD || '1234',
          database: 'api_server_test',
          entities: [AccountEntity],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([AccountEntity]),
      ],
    }).compile();
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  afterEach(async () => {
    await dataSource.query(`DELETE FROM accounts WHERE id >= ${ID}`);
  });

  it('B1: fetchAllAccounts walks pages until an empty one', async () => {
    const pages = [page([[1, 'a@test', true]]), page([[2, 'b@test', false]])];
    const fetchPage = jest
      .fn()
      .mockImplementation(async (afterId: number) => {
        if (afterId === 0) return pages[0];
        if (afterId === 1) return pages[1];
        return { items: [] };
      });

    const seen: number[] = [];
    for await (const account of fetchAllAccounts(fetchPage, 1)) {
      seen.push(account.id);
    }

    expect(seen).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(3); // 2 страницы + пустая
  });

  it('B2: runBackfill inserts rows and counts the second pass as existing', async () => {
    const fetchPage = async (afterId: number) =>
      afterId < ID
        ? page([
            [ID, 'backfill1@test', true],
            [ID + 1, 'backfill2@test', false],
          ])
        : { items: [] };

    const first = await runBackfill(dataSource, fetchPage);
    expect(first.mirrored).toBe(2);
    expect(first.existing).toBe(0);

    const [row] = await dataSource.query(
      `SELECT username, is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(row.username).toBe('backfill1@test');
    expect(Number(row.is_activated)).toBe(1);

    // повторный прогон идемпотентен
    const second = await runBackfill(dataSource, fetchPage);
    expect(second.mirrored).toBe(0);
    expect(second.existing).toBe(2);
  });

  it('B3: backfill does not overwrite event-driven state (ON CONFLICT DO NOTHING)', async () => {
    // confirmed пришёл раньше бэкфилла: строка активна
    await dataSource.query(
      `INSERT INTO accounts (id, username, is_activated) VALUES ($1, 'live@test', 1)`,
      [ID],
    );

    await runBackfill(dataSource, async (afterId: number) =>
      afterId < ID ? page([[ID, 'live@test', false]]) : { items: [] },
    );

    const [row] = await dataSource.query(
      `SELECT is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(Number(row.is_activated)).toBe(1);
  });
});
