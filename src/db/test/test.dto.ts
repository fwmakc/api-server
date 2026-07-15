import {
  DtoColumn,
  DtoCreatedColumn,
  DtoEnumColumn,
  DtoJsonColumn,
  DtoUpdatedColumn,
} from '@lms/common';
import { TypeValues } from '@lms/common';
import { CommonDto } from '@lms/common';

export class TestDto extends CommonDto {
  @DtoCreatedColumn()
  createdAt?: Date;

  @DtoUpdatedColumn()
  updatedAt?: Date;

  @DtoColumn('int type description')
  int?: number;

  @DtoColumn('bigint type description')
  bigint?: number;

  @DtoColumn('smallint type description')
  smallint?: number;

  @DtoColumn('float type description')
  float?: number;

  @DtoColumn('boolean type description')
  boolean?: boolean;

  @DtoColumn('varchar type description')
  varchar?: string;

  @DtoColumn('text type description')
  text?: string;

  @DtoJsonColumn('json type description')
  json?: object | null;

  @DtoColumn('date type description')
  date?: Date;

  @DtoEnumColumn('enum type description', TypeValues, TypeValues.DEFAULT)
  enum?: TypeValues;
}
