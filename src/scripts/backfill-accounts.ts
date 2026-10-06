import { DataSource } from "typeorm";
import { httpGet } from "api-server-toolkit/helper";

/**
 * Бэкфилл accounts-зеркала из auth-server. Нужен один раз при включении
 * зеркала на живом инсталле: события шины покрывают только новые
 * регистрации, а существующие аккаунты в api_server отсутствуют — без
 * бэкфилла их посты падают на FK. Идемпотентен: INSERT ... ON CONFLICT
 * (id) DO NOTHING — повторный прогон ничего не меняет, а строка,
 * изменённая событиями (confirmed/deactivated), не перетирается.
 *
 * Запуск (после npm run build):
 *   node -r tsconfig-paths/register dist/scripts/backfill-accounts.js
 *
 * Env: AUTH_SERVER_URL (по умолчанию http://auth-server:3001),
 * INTERNAL_API_KEY (обязателен), DB_* — стандартное подключение api-server.
 */

interface MirrorAccount {
  id: number;
  username: string;
  isActivated: boolean;
}

interface ListPage {
  items: MirrorAccount[];
}

/** Курсорный обход листинга auth-server'а до пустой страницы. */
export async function* fetchAllAccounts(
  fetchPage: (afterId: number, limit: number) => Promise<ListPage>,
  batch = 500,
): AsyncGenerator<MirrorAccount> {
  let afterId = 0;
  for (;;) {
    const page = await fetchPage(afterId, batch);
    if (page.items.length === 0) return;
    for (const item of page.items) {
      yield item;
    }
    afterId = page.items[page.items.length - 1].id;
  }
}

/**
 * Заливает страницы в зеркало. Возвращает счётчики: mirrored — вставлено
 * сейчас, existing — уже было (ON CONFLICT).
 */
export async function runBackfill(
  ds: DataSource,
  fetchPage: (afterId: number, limit: number) => Promise<ListPage>,
  batch = 500,
): Promise<{ mirrored: number; existing: number }> {
  let mirrored = 0;
  let existing = 0;

  for await (const account of fetchAllAccounts(fetchPage, batch)) {
    // RETURNING различает вставку и ON CONFLICT: пустой массив = строка
    // уже была (и её состояние принадлежит событиям, не бэкфиллу).
    const result = await ds.query(
      `INSERT INTO "accounts" ("id", "username", "is_activated")
       VALUES ($1, $2, $3) ON CONFLICT ("id") DO NOTHING RETURNING "id"`,
      [account.id, account.username, account.isActivated ? 1 : 0],
    );
    if (Array.isArray(result) && result.length > 0) mirrored++;
    else existing++;
  }

  return { mirrored, existing };
}

function defaultFetchPage(
  baseUrl: string,
  apiKey: string,
): (afterId: number, limit: number) => Promise<ListPage> {
  return async (afterId, limit) => {
    const res = await httpGet<ListPage>(
      `${baseUrl}/account/internal/list?after=${afterId}&limit=${limit}`,
      { headers: { "X-Internal-Api-Key": apiKey }, timeout: 15000 },
    );
    return res.data;
  };
}

async function main(): Promise<void> {
  const baseUrl = process.env.AUTH_SERVER_URL || "http://auth-server:3001";
  const apiKey = process.env.INTERNAL_API_KEY;
  if (!apiKey) {
    console.error("INTERNAL_API_KEY is required");
    process.exit(1);
  }

  const { default: AppDataSource } = await import("../config/typeorm.config");
  const ds: DataSource = AppDataSource;
  if (!ds.isInitialized) await ds.initialize();

  try {
    const result = await runBackfill(
      ds,
      defaultFetchPage(baseUrl, apiKey),
      Number(process.env.BACKFILL_BATCH) || 500,
    );
    console.log(
      JSON.stringify({
        status: "ok",
        mirrored: result.mirrored,
        existing: result.existing,
      }),
    );
  } finally {
    await ds.destroy();
  }
}

// Запускается только как скрипт (не при импорте из тестов).
if (require.main === module) {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
