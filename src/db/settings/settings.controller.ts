import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
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
    create: 'superuser',
    update: 'superuser',
    delete: 'superuser',
  },
})<SettingsDto, SettingsEntity, SettingsService> {
  constructor(readonly service: SettingsService) {
    super();
  }
}
