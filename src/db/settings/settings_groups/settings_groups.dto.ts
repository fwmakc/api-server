import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn } from '@core/common';
import { CommonDto } from '@core/common';
import { SettingsDto } from '../settings.dto';

export class SettingsGroupsDto extends CommonDto {
  @DtoColumn('Имя группы')
  name?: string;

  @DtoColumn('Описание или комментарий')
  description?: string;

  @DtoColumn('Позиция для ручной сортировки')
  position?: number;

  @DtoColumn('Флаг, который показывает, выключена или нет эта группа')
  isDisabled?: boolean;

  @ApiProperty({
    required: false,
    description: 'Данные настроек, входящих в группу',
    type: () => [SettingsDto],
  })
  settings?: SettingsDto[];
}
