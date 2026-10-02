/**
 * Wiring check (Wave 6, stage 2): boots the REAL AppModule (real entities,
 * boot migrations, AccessModule.forRoot() config validation, real DI graph)
 * against a fresh throwaway database, then probes one real write per
 * critical subsystem. Runs under ts-node — the production module system —
 * because jest's module registry races with pg's lazy native getter here.
 *
 * Usage: npm run test:wiring   (requires postgres on 127.0.0.1:5432 root/1234)
 * Exit code 0 = all probes green.
 */
process.env.DB_TYPE = "postgres";
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = "5432";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "1234";
process.env.DB_NAME = "api_server_wiring_test";
process.env.EVENT_SERVER_URL = "http://127.0.0.1:9";
process.env.THROTTLE_STORAGE = "memory";
process.env.INTERNAL_API_KEY = "wiring-internal-key";

import { Client } from "pg";
import { DataSource } from "typeorm";

const WIRING_DB = "api_server_wiring_test";

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean, extra?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
}

async function recreateDatabase(): Promise<void> {
  const client = new Client({
    host: "127.0.0.1",
    port: 5432,
    user: "root",
    password: process.env.DB_PASSWORD || "1234",
    database: "postgres",
  });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${WIRING_DB} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${WIRING_DB}`);
  await client.end();
}

async function main(): Promise<void> {
  console.log("Wiring check — api-server real boot");
  await recreateDatabase();

  // Must run before TypeORM initializes, same as src/main.ts.
  const { initializeTransactionalContext } = await import("typeorm-transactional");
  initializeTransactionalContext();

  const { AppModule } = await import("../src/app.module");
  const { NestFactory } = await import("@nestjs/core");
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const dataSource = app.get(DataSource);
  console.log("  ✓ AppModule booted (AccessModule.forRoot() config validated)");

  const migrations: any[] = await dataSource.query(
    "SELECT count(*)::int AS n FROM migrations_typeorm",
  );
  ok("boot migrations applied", migrations[0].n > 0, `count=${migrations[0].n}`);

  // ── Probe: settings (key-value subsystem) ──
  console.log("probe: settings");
  const { SettingsService } = await import("../src/db/settings/settings.service");
  const settingsService = app.get(SettingsService);
  const created = await settingsService.create({
    name: "wiring-probe",
    value: "wiring-value-1",
  } as any);
  ok("settings create writes a row", !!created?.id);
  const found = await settingsService.findOne(
    { filter: { name: "wiring-probe" } } as any,
    { allow: true } as any,
  );
  ok("settings read back through the service", (found as any)?.value === "wiring-value-1");

  // ── Probe: posts (owner-stamped content subsystem) ──
  console.log("probe: posts");
  const { PostsService } = await import("../src/db/posts/posts.service");
  const postsService = app.get(PostsService);
  const post = await postsService.create(
    { title: "Wiring Post", content: "wiring content", isPublished: false } as any,
    undefined,
    { allow: true } as any,
  );
  ok("posts create writes a row", !!post?.id);
  const postRead = await postsService.findOne(
    { filter: { id: post.id } } as any,
    { allow: true } as any,
  );
  ok("posts read back through the service", (postRead as any)?.title === "Wiring Post");

  await app.close();

  console.log(`\nWiring: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Wiring check crashed:", e);
  process.exit(1);
});
