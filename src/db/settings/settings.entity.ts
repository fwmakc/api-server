import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TypeValues } from '@src/common/common.enum';
import { SettingsGroupsEntity } from './settings_groups/settings_groups.entity';
import {
  BooleanColumn,
  EnumColumn,
  IdColumn,
  PositionAscColumn,
  TextColumn,
  VarcharColumn,
} from '@src/common/common.column';

@ObjectType()
@Entity({ name: 'settings' })
export class SettingsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name', 100)
  name?: string;

  @VarcharColumn('description', 1024)
  description?: string;

  @EnumColumn('type', TypeValues, TypeValues.DEFAULT)
  type?: TypeValues;

  @PositionAscColumn()
  position?: string;

  @TextColumn('default')
  default?: string;

  @TextColumn('value')
  value?: string;

  @BooleanColumn('is_disabled')
  isDisabled?: boolean;

  @Field(() => SettingsGroupsEntity, { nullable: true })
  @ManyToOne(() => SettingsGroupsEntity, (group) => group.settings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'settings_group_id', referencedColumnName: 'id' })
  group?: SettingsGroupsEntity;
}
