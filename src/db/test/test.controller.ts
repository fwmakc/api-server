import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { TestDto } from './test.dto';
import { TestEntity } from './test.entity';
import { TestService } from './test.service';

@Controller('test')
export class TestController extends EntityController({
  name: 'Тест',
  dto: TestDto,
  entity: TestEntity,
})<TestDto, TestEntity, TestService> {
  constructor(readonly service: TestService) {
    super();
  }
}
