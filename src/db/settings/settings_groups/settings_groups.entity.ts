import { BaseEntity, Entity, OneToMany } from 'typeorm';
import { SettingsEntity } from '../settings.entity';
import {
  BooleanColumn,
  IdColumn,
  PositionAscColumn,
  VarcharColumn,
} from '@core/common';

@Entity({ name: 'settings_groups' })
export class SettingsGroupsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name', 100)
  name?: string;

  @VarcharColumn('description', 1024)
  description?: string;

  @PositionAscColumn()
  position?: string;

  @BooleanColumn('is_disabled')
  isDisabled: boolean;

  @OneToMany(() => SettingsEntity, (setting) => setting.group, {
    cascade: true,
  })
  settings: SettingsEntity[];
}
