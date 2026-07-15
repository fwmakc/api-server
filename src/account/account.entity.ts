import { BaseEntity, Entity } from 'typeorm';
import {
  BooleanColumn,
  CreatedColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';

@Entity({ name: 'accounts' })
export class AccountEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('username', 'normal', { index: 'unique' })
  username: string;

  @VarcharColumn('password')
  password: string;

  @BooleanColumn('is_activated')
  isActivated: boolean;

  @BooleanColumn('is_superuser')
  isSuperuser: boolean;
}
