import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn, DtoEnumColumn } from '@lms/common';
import { TypeValues } from '@lms/common';
import { CommonDto } from '@lms/common';
import { SettingsGroupsDto } from './settings_groups/settings_groups.dto';

export class SettingsDto extends CommonDto {
  @DtoColumn('Имя для настройки')
  name?: string;

  @DtoColumn('Описание или комментарий')
  description?: string;

  @DtoEnumColumn('Тип данных', TypeValues, TypeValues.DEFAULT)
  type?: TypeValues;

  @DtoColumn('Позиция для ручной сортировки')
  position?: number;

  @DtoColumn('Значение по-умолчанию')
  default?: string;

  @DtoColumn('Значение')
  value?: string;

  @DtoColumn('Флаг, который показывает, выключена или нет эта настройка', {
    defaultValue: false,
  })
  isDisabled?: boolean;

  @ApiProperty({
    required: false,
    description: 'группа настроек',
    type: () => SettingsGroupsDto,
  })
  group?: SettingsGroupsDto;
}
