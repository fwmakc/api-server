import { BaseEntity, Entity } from 'typeorm';
import {
  BooleanColumn,
  CreatedColumn,
  IdColumn,
  PermissionRegistry,
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

  @VarcharColumn('password')
  password: string;

  @BooleanColumn('is_activated')
  isActivated: boolean;

  @BooleanColumn('is_superuser')
  isSuperuser: boolean;
}

// Аккаунт в api-server — только цель связей (контроллера нет), но пароль
// нельзя отдавать даже во вложенных ответах. Правила видимости — в реестре.
PermissionRegistry.set(AccountEntity, {
  fields: {
    password: {
      response: [{ who: ['superuser'] }],
      request: [{ who: ['superuser'] }],
    },
  },
});
