import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { getDbConfig } from '@config/db.config';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { NogqlModule } from '@src/common/module/nogql.module';
import AppImports from './app.imports';

@Module({
  controllers: [AppController],
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDbConfig,
      async dataSourceFactory(option) {
        if (!option) throw new Error('Invalid options passed');
        return addTransactionalDataSource(new DataSource(option));
      },
    }),
    process.env.GQL_ENABLE
      ? GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: 'schema.gql',
          sortSchema: true,
          playground: !!process.env.GQL_PLAYGROUND,
        })
      : NogqlModule,
    ...AppImports,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
  ],
})
export class AppModule {}
