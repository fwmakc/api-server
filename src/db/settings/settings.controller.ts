import { Controller } from '@nestjs/common';
import { EntityController } from '@src/common/entity.controller';
import { SettingsDto } from './settings.dto';
import { SettingsEntity } from './settings.entity';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController extends EntityController({
  name: 'Настройки',
  dto: SettingsDto,
  entity: SettingsEntity,
  operations: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})<SettingsDto, SettingsEntity, SettingsService> {
  constructor(readonly service: SettingsService) {
    super();
  }
}
