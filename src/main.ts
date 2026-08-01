import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import redoc from 'redoc-express';
import helmet from 'helmet';
import { AppModule } from '@src/app.module';
import * as cookieParser from 'cookie-parser';
import * as morgan from 'morgan';
import * as passport from 'passport';
import { initializeTransactionalContext } from 'typeorm-transactional';

const DEFAULT_REQUEST_TIMEOUT = 30000;

function startEventLoopMonitoring() {
  const logger = new Logger('Metrics');
  const INTERVAL = 10000;
  const LAG_THRESHOLD = 100;

  let lastCheck = process.hrtime.bigint();
  let maxLag = 0;
  let lagCount = 0;

  setInterval(() => {
    const now = process.hrtime.bigint();
    const lag =
      Number(now - lastCheck - BigInt(INTERVAL * 1_000_000)) / 1_000_000;

    lastCheck = now;

    if (lag > maxLag) maxLag = lag;
    if (lag > LAG_THRESHOLD) lagCount++;

    const memory = process.memoryUsage();
    const heapUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (memory.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (memory.rss / 1024 / 1024).toFixed(2);
    const heapPercent = ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1);

    logger.log(
      `eventLoop lag=${lag.toFixed(2)}ms max=${maxLag.toFixed(2)}ms events=${lagCount} ${lag > LAG_THRESHOLD ? 'SLOW' : 'OK'} | heap=${heapUsedMB}/${heapTotalMB}MB (${heapPercent}%) rss=${rssMB}MB ${Number(heapPercent) > 90 ? 'HIGH' : 'OK'} | uptime=${new Date(process.uptime() * 1000).toISOString().substr(11, 8)}`,
    );

    if (process.uptime() % 60 < 10) {
      maxLag = 0;
      lagCount = 0;
    }
  }, INTERVAL);

  let lastImmediate = Date.now();

  function checkImmediate() {
    const now = Date.now();
    const delay = now - lastImmediate;

    if (delay > 1000) {
      logger.warn(`Event loop blocked for ${delay}ms at ${new Date().toISOString()}`);
    }

    lastImmediate = now;
    setImmediate(checkImmediate);
  }

  setImmediate(checkImmediate);
}

async function bootstrap() {
  initializeTransactionalContext();

  const requestTimeout = isNaN(parseInt(process.env.REQUEST_TIMEOUT))
    ? DEFAULT_REQUEST_TIMEOUT
    : parseInt(process.env.REQUEST_TIMEOUT);

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV || 'localhost',
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      allowedHeaders: [
        'Content-Type',
        'Vary',
        'Accept',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
        'Authorization',
        'X-Requested-With',
      ],
      exposedHeaders: [
        'Content-Type',
        'Vary',
        'Accept',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
        'Authorization',
        'X-Requested-With',
      ],
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.MORGAN_LOG_FORMAT) {
    app.use(morgan(process.env.MORGAN_LOG_FORMAT));
  }

  if (process.env.PREFIX) {
    app.setGlobalPrefix(process.env.PREFIX);
  }

  if (process.env.SWAGGER_PREFIX) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || '')
      .setDescription(process.env.SWAGGER_DESCRIPTION || '')
      .setVersion(process.env.SWAGGER_VERSION || '')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(process.env.SWAGGER_PREFIX, app, swaggerDocument);
  }

  if (process.env.SWAGGER_PREFIX_REDOC) {
    const redocConfig = {
      title: process.env.SWAGGER_TITLE || '',
      version: process.env.SWAGGER_VERSION || '',
      specUrl: `${process.env.SWAGGER_PREFIX}-json`,
    };
    app.use(`${process.env.SWAGGER_PREFIX_REDOC}`, redoc(redocConfig));
  }

  app.use(cookieParser());
  app.use(passport.initialize());

  const port = process.env.PORT || 5000;
  const ip = process.env.IP || 'localhost';
  const logger = new Logger('Bootstrap');

  await app.listen(port, ip);
  logger.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${port} at http://${ip}:${port}`,
  );

  if (process.env.METRICS_ENABLE === 'true') {
    logger.log('Starting performance monitoring...');
    startEventLoopMonitoring();
  }

  process.on('SIGINT', () => {
    app.close();
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start api server:', err);
  process.exit(1);
});
