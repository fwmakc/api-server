import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthClientModule } from 'api-server-toolkit/auth-client';

import { AccountEntity } from './account.entity';
import { AccountService } from './account.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity]),
    AuthClientModule.forRoot(),
  ],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
