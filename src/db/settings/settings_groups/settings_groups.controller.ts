import { Controller } from '@nestjs/common';
import { EntityController } from '@core/common';
import { SettingsGroupsDto } from './settings_groups.dto';
import { SettingsGroupsEntity } from './settings_groups.entity';
import { SettingsGroupsService } from './settings_groups.service';

@Controller('settings/groups')
export class SettingsGroupsController extends EntityController({
  name: 'Группы настроек',
  dto: SettingsGroupsDto,
  entity: SettingsGroupsEntity,
  operations: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})<SettingsGroupsDto, SettingsGroupsEntity, SettingsGroupsService> {
  constructor(readonly service: SettingsGroupsService) {
    super();
  }
}
