import { BaseEntity, Entity } from 'typeorm';
import {
  BigIntColumn,
  BooleanColumn,
  CreatedColumn,
  DateColumn,
  EnumColumn,
  FloatColumn,
  IdColumn,
  IntColumn,
  JsonColumn,
  SmallIntColumn,
  TextColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@lms/common';
import { TypeValues } from '@lms/common';

@Entity({ name: 'test' })
export class TestEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @IntColumn('int')
  int: number;

  @BigIntColumn('bigint')
  bigint: number;

  @SmallIntColumn('smallint')
  smallint: number;

  @FloatColumn('float')
  float: number;

  @BooleanColumn('boolean')
  boolean: boolean;

  @VarcharColumn('varchar')
  varchar?: string;

  @TextColumn('text')
  text: string;

  @JsonColumn('json')
  json: object | null;

  @DateColumn('date')
  date: Date;

  @EnumColumn('enum', TypeValues, TypeValues.DEFAULT)
  enum: TypeValues;
}
