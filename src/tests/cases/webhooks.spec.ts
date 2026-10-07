import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as os from 'os';
import { AccountEntity } from '../../account/account.entity';
import { PostsEntity } from '../../db/posts/posts.entity';
import { PostsCategoriesEntity } from '../../db/posts/posts_categories/posts_categories.entity';
import { PostsTagsEntity } from '../../db/posts/posts_tags/posts_tags.entity';
import { ProcessedEventEntity } from '../../webhooks/processed-event.entity';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { SubscriberService } from '../../webhooks/subscriber.service';

jest.mock('api-server-toolkit/helper', () => ({
  httpPost: jest.fn(),
}));
// AuthClientService here is a DI token only — the real module's static
// import chain pulls ESM-only deps jest (CJS) can't parse. The service
// under test just calls clearCache on it.
jest.mock('api-server-toolkit/auth-client', () => ({
  AuthClientService: class AuthClientService {},
}));

import { httpPost } from 'api-server-toolkit/helper';
import { AuthClientService } from 'api-server-toolkit/auth-client';

// Синтетический диапазон id зеркала — не пересекается с сиддами alice/bob.
const ID = 990001;

function event(pattern: string, payload: any, eventId = 1) {
  return {
    eventId,
    pattern,
    payload,
    source: 'auth-server',
    timestamp: new Date().toISOString(),
    attempt: 1,
  } as any;
}

describe('Webhooks — accounts mirror projection', () => {
  let moduleRef: TestingModule;
  let service: WebhooksService;
  let authMock: { clearCache: jest.Mock };
  let dataSource: DataSource;

  beforeAll(async () => {
    // Отдельный модуль с ПРОДАКШН-сущностями: общий createTestModule живёт
    // в параллельной вселенной TestEntity. synchronize воспроизводит FK
    // posts.account_id → accounts (NO ACTION) из метаданных ManyToOne.
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'root',
          password: process.env.DB_PASSWORD || '1234',
          database: 'api_server_test',
          entities: [
            AccountEntity,
            PostsEntity,
            PostsCategoriesEntity,
            PostsTagsEntity,
            ProcessedEventEntity,
          ],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          AccountEntity,
          PostsEntity,
          PostsCategoriesEntity,
          PostsTagsEntity,
          ProcessedEventEntity,
        ]),
      ],
      providers: [
        WebhooksService,
        { provide: AuthClientService, useValue: { clearCache: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(WebhooksService);
    authMock = moduleRef.get(AuthClientService) as any;
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM webhook_processed_events`);
    await dataSource.query(
      `DELETE FROM posts WHERE account_id >= ${ID}`,
    );
    await dataSource.query(`DELETE FROM accounts WHERE id >= ${ID}`);
  });

  it('M1: user.registered with confirmUrl inserts a deactivated row', async () => {
    await service.handleEvent(
      event('user.registered', {
        userId: ID,
        username: 'storm1@test',
        email: 'storm1@test',
        confirmUrl: 'https://app/confirm?token=x',
      }),
    );

    const [row] = await dataSource.query(
      `SELECT id, username, is_activated, password FROM accounts WHERE id = ${ID}`,
    );
    expect(row.username).toBe('storm1@test');
    expect(Number(row.is_activated)).toBe(0);
    // пароль зеркалом никогда не пишется (дефолт колонки — пустая строка)
    expect(row.password || '').toBe('');
  });

  it('M2: user.registered without confirmUrl inserts an activated row', async () => {
    await service.handleEvent(
      event('user.registered', { userId: ID, username: 'storm2@test' }, 2),
    );

    const [row] = await dataSource.query(
      `SELECT is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(Number(row.is_activated)).toBe(1);
  });

  it('M3: redelivered registered (same eventId) is a ledger no-op and cannot un-confirm', async () => {
    const payload = {
      userId: ID,
      username: 'storm3@test',
      confirmUrl: 'https://app/confirm?token=x',
    };
    await service.handleEvent(event('user.registered', payload, 3));
    await service.handleEvent(
      event('user.confirmed', { userId: ID, username: 'storm3@test' }, 4),
    );
    // та же доставка ( eventId=3 ) приходит повторно — НЕ должна сбросить
    // is_activated поверх confirmed
    await service.handleEvent(event('user.registered', payload, 3));

    const [row] = await dataSource.query(
      `SELECT is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(Number(row.is_activated)).toBe(1);

    const ledger = await dataSource.query(
      `SELECT event_id FROM webhook_processed_events ORDER BY event_id`,
    );
    expect(ledger).toHaveLength(2);
  });

  it('M4: user.confirmed self-heals a lost register (row absent → insert activated)', async () => {
    await service.handleEvent(
      event('user.confirmed', { userId: ID, username: 'storm4@test' }, 5),
    );

    const [row] = await dataSource.query(
      `SELECT username, is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(row.username).toBe('storm4@test');
    expect(Number(row.is_activated)).toBe(1);
  });

  it('M5: user.deactivated flips is_activated and self-heals a missing row', async () => {
    await service.handleEvent(
      event('user.deactivated', { userId: ID, username: 'storm5@test' }, 6),
    );

    const [row] = await dataSource.query(
      `SELECT is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(Number(row.is_activated)).toBe(0);
  });

  it('M6: user.deleted removes the mirror row', async () => {
    await service.handleEvent(
      event('user.registered', { userId: ID, username: 'storm6@test' }, 7),
    );
    await service.handleEvent(
      event('user.deleted', { userId: ID, username: 'storm6@test' }, 8),
    );

    const rows = await dataSource.query(
      `SELECT id FROM accounts WHERE id = ${ID}`,
    );
    expect(rows).toHaveLength(0);
  });

  it('M7: user.deleted with referencing posts keeps an inert tombstone (FK NO ACTION)', async () => {
    await service.handleEvent(
      event('user.registered', { userId: ID, username: 'storm7@test' }, 9),
    );
    await dataSource.query(
      `INSERT INTO posts (title, is_published, account_id) VALUES ('held post', 1, ${ID})`,
    );

    await service.handleEvent(
      event('user.deleted', { userId: ID, username: 'storm7@test' }, 10),
    );

    const [row] = await dataSource.query(
      `SELECT username FROM accounts WHERE id = ${ID}`,
    );
    expect(row.username).toBe('storm7@test');

    await dataSource.query(`DELETE FROM posts WHERE account_id = ${ID}`);
  });

  it('M8: failed handler rolls the ledger marker back (delivery will be retried)', async () => {
    await expect(
      service.handleEvent(event('user.registered', {}, 11)),
    ).rejects.toThrow();

    const ledger = await dataSource.query(
      `SELECT id FROM webhook_processed_events WHERE event_id = '11'`,
    );
    expect(ledger).toHaveLength(0);
  });

  it('M9: unknown patterns touch neither the ledger nor the mirror', async () => {
    await service.handleEvent(event('audit.event', { action: 'x' }, 12));

    const ledger = await dataSource.query(
      `SELECT id FROM webhook_processed_events`,
    );
    expect(ledger).toHaveLength(0);
  });

  it('M10: invalidation is per-delivery (outside the ledger), roles_changed has no mirror write', async () => {
    authMock.clearCache.mockClear();
    await service.handleEvent(
      event('user.roles_changed', {
        userId: ID,
        username: 'storm10@test',
        email: 'storm10@test',
        roles: ['admin'],
      }, 13),
    );
    // roles_changed: cache drop, but no ledger row (nothing to dedupe)
    expect(authMock.clearCache).toHaveBeenCalledWith(ID);
    let ledger = await dataSource.query(
      `SELECT id FROM webhook_processed_events`,
    );
    expect(ledger).toHaveLength(0);
    let rows = await dataSource.query(
      `SELECT id FROM accounts WHERE id = ${ID}`,
    );
    expect(rows).toHaveLength(0);

    // deactivated delivered twice: the ledger dedupes the mirror write,
    // yet BOTH deliveries drop the cache
    const payload = { userId: ID, username: 'storm10@test', email: 'storm10@test' };
    await service.handleEvent(event('user.deactivated', payload, 14));
    await service.handleEvent(event('user.deactivated', payload, 14));
    expect(authMock.clearCache).toHaveBeenCalledTimes(3);
    ledger = await dataSource.query(
      `SELECT id FROM webhook_processed_events`,
    );
    expect(ledger).toHaveLength(1);
    rows = await dataSource.query(
      `SELECT is_activated FROM accounts WHERE id = ${ID}`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('SubscriberService — event-server registration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('S1: registers the lifecycle + invalidation patterns under the api-server name', async () => {
    (httpPost as jest.Mock).mockResolvedValue({ status: 200, ok: true });
    const config = {
      get: (_: string, fallback?: string) => fallback,
    };
    await new SubscriberService(config as any).onApplicationBootstrap();

    expect(httpPost).toHaveBeenCalledWith(
      'http://event-server:3005/subscribe',
      {
        service: 'api-server',
        // per-replica default: own container hostname, not the shared
        // service DNS name (subscriptions key on (service, url))
        url: `http://${os.hostname()}:5000/webhooks/events`,
        patterns: [
          'user.registered',
          'user.confirmed',
          'user.deactivated',
          'user.deleted',
          'user.roles_changed',
        ],
        active: true,
      },
      { headers: { 'X-Internal-Api-Key': 'changeme' }, timeout: 5000 },
    );
  });

  it('S2: PREFIX env shifts the default webhook URL', async () => {
    (httpPost as jest.Mock).mockResolvedValue({ status: 200, ok: true });
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'PREFIX' ? 'api' : fallback,
    };
    await new SubscriberService(config as any).onApplicationBootstrap();

    expect((httpPost as jest.Mock).mock.calls[0][1].url).toBe(
      `http://${os.hostname()}:5000/api/webhooks/events`,
    );
  });

  it('S3: WEBHOOK_SECRET is passed to the subscription', async () => {
    (httpPost as jest.Mock).mockResolvedValue({ status: 200, ok: true });
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'WEBHOOK_SECRET' ? 's3cret' : fallback,
    };
    await new SubscriberService(config as any).onApplicationBootstrap();

    expect((httpPost as jest.Mock).mock.calls[0][1].secret).toBe('s3cret');
  });

  it('S4: WEBHOOK_URL overrides the per-replica default entirely', async () => {
    (httpPost as jest.Mock).mockResolvedValue({ status: 200, ok: true });
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'WEBHOOK_URL'
          ? 'http://api-server:5000/webhooks/events'
          : fallback,
    };
    await new SubscriberService(config as any).onApplicationBootstrap();

    expect((httpPost as jest.Mock).mock.calls[0][1].url).toBe(
      'http://api-server:5000/webhooks/events',
    );
  });
});
