import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from '@src/account/account.module';
import { PersonsController } from './persons.controller';
import { PersonsEntity } from './persons.entity';
import { PersonsService } from './persons.service';

@Module({
  controllers: [PersonsController],
  imports: [
    TypeOrmModule.forFeature([PersonsEntity]),
    forwardRef(() => AccountModule),
  ],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
