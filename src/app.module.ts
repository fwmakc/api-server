import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { getDbConfig } from '@config/db.config';
import {
  RemovePrivateFieldsInterceptor,
  AuditModule,
  AccessModule,
  runMigrationsUnderLock,
} from 'api-server-toolkit';
import { HealthModule } from 'api-server-toolkit/health';
import { MetricsModule } from 'api-server-toolkit/metrics';
import AppImports from './app.imports';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDbConfig,
      async dataSourceFactory(option) {
        if (!option) throw new Error('Invalid options passed');
        // Serialize boot migrations across replicas (TypeORM has no
        // built-in migration locking); the helper consumes `migrationsRun`.
        const { migrationsRun, ...dsOption } = option;
        if (migrationsRun) {
          await runMigrationsUnderLock(dsOption as DataSourceOptions);
        }
        return addTransactionalDataSource(
          new DataSource(dsOption as DataSourceOptions),
        );
      },
    }),
    ...AppImports,
    HealthModule.forRoot('api-server'),
    MetricsModule.forRoot({ service: 'api-server' }),
    AuditModule.forRoot(),
    // fail-fast: валидирует dot-path'и scope и имена полей Access-конфигов
    // против entity-метаданных на старте
    AccessModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RemovePrivateFieldsInterceptor,
    },
  ],
})
export class AppModule {}
