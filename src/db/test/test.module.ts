import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestController } from './test.controller';
import { TestEntity } from './test.entity';
import { TestService } from './test.service';

@Module({
  controllers: [TestController],
  imports: [TypeOrmModule.forFeature([TestEntity])],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
