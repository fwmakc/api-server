import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn } from '@src/common/common.column';
import { CommonDto } from '@src/common/common.dto';
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
