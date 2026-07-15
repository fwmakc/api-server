import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientsEntity } from './clients.entity';
import { ClientsService } from './clients.service';
import { ClientsStrategy } from './clients.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([ClientsEntity]), ConfigModule],
  providers: [ClientsService, ClientsStrategy],
  exports: [ClientsService],
})
export class ClientsModule {}
