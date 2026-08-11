import { Controller } from '@nestjs/common';
import { AccessLevel, EntityController } from 'api-server-toolkit';
import { SettingsGroupsDto } from './settings_groups.dto';
import { SettingsGroupsEntity } from './settings_groups.entity';
import { SettingsGroupsService } from './settings_groups.service';

@Controller('settings/groups')
export class SettingsGroupsController extends EntityController({
  name: 'Группы настроек',
  dto: SettingsGroupsDto,
  entity: SettingsGroupsEntity,
  operations: {
    read: AccessLevel.PUBLIC,
    create: AccessLevel.SUPERUSER,
    update: AccessLevel.SUPERUSER,
    delete: AccessLevel.SUPERUSER,
  },
})<SettingsGroupsDto, SettingsGroupsEntity, SettingsGroupsService> {
  constructor(readonly service: SettingsGroupsService) {
    super();
  }
}
