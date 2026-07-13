import { Controller } from '@nestjs/common';
import { EntityController } from '@src/common/entity.controller';
import { PersonsDto } from './persons.dto';
import { PersonsEntity } from './persons.entity';
import { PersonsService } from './persons.service';

@Controller('persons')
export class PersonsController extends EntityController({
  name: 'Персонажи',
  dto: PersonsDto,
  entity: PersonsEntity,
  operations: {
    read: 'owner',
    create: 'owner',
    update: 'owner',
    delete: 'owner',
  },
})<PersonsDto, PersonsEntity, PersonsService> {
  constructor(readonly service: PersonsService) {
    super();
  }
}
