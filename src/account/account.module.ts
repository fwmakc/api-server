import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from './account.entity';
import { AccountService } from './account.service';
import { AccountStrategy } from './account.strategy';
import { AuthClientModule } from '@src/auth-client/auth-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity]),
    ConfigModule,
    AuthClientModule,
  ],
  providers: [AccountService, AccountStrategy],
  exports: [AccountService],
})
export class AccountModule {}
