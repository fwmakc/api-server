import { BaseEntity, Entity } from 'typeorm';
import {
  AccessLevel,
  BooleanColumn,
  CreatedColumn,
  FieldAccess,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from 'api-server-toolkit';

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

  @FieldAccess({ read: AccessLevel.CLOSED })
  @VarcharColumn('password')
  password: string;

  @BooleanColumn('is_activated')
  isActivated: boolean;

  @BooleanColumn('is_superuser')
  isSuperuser: boolean;
}
