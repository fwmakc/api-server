import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { bootstrap } from 'api-server-toolkit/bootstrap';
import {
  Sentry,
  Helmet,
  Morgan,
  Cors,
  CookieParser,
  Passport,
  ValidationPipe,
  Log,
  Prefix,
  Swagger,
} from 'api-server-toolkit/bootstrap/setup';
import { AppModule } from '@src/app.module';
import { startMetrics } from '@src/app.metrics';

async function main() {
  // Must run before TypeORM initializes: app.module always wraps the
  // DataSource with addTransactionalDataSource, and boot migrations
  // (migrationsRun) touch the patched EntityManager during initialize().
  const { initializeTransactionalContext } =
    await import('typeorm-transactional');
  initializeTransactionalContext();

  // rawBody keeps the exact request bytes for the EventDeliveryGuard
  // (HMAC is verified over the signed string, not the re-serialized body).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  Sentry.setup(app);
  Helmet.setup(app);
  Cors.setup(app);
  CookieParser.setup(app);
  Passport.setup(app);
  ValidationPipe.setup(app);
  Log.setup(app);
  Morgan.setup(app);
  Prefix.setup(app);
  Swagger.setup(app);

  if (process.env.METRICS_ENABLE === 'true') {
    const logger = new Logger('Bootstrap');
    logger.log('Starting performance monitoring...');
    startMetrics();
  }

  await bootstrap(app, { port: 5000 });
}

main();
