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
    read: [{ who: ['public'] }],
    create: [{ who: ['superuser'] }],
    update: [{ who: ['superuser'] }],
    delete: [{ who: ['superuser'] }],
  },
  // анонимные читатели получают default; живое value может разойтись с ним
  // и содержать внутренние данные — только для залогиненных
  fields: {
    value: {
      response: [{ who: ['authenticated'] }],
    },
  },
})<SettingsDto, SettingsEntity, SettingsService> {
  constructor(readonly service: SettingsService) {
    super();
  }
}
