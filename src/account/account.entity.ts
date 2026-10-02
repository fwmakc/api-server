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
// нельзя отдавать даже во вложенных ответах, а username — это email
// (перечисление адресов через ?relations=account у постов), флаги
// isActivated/isSuperuser — служебная информация. Правила — в реестре;
// они применяются ко всем вложенным появлениям AccountEntity.
PermissionRegistry.set(AccountEntity, {
  fields: {
    password: {
      response: [{ who: ['superuser'] }],
      request: [{ who: ['superuser'] }],
    },
    username: {
      response: [{ who: ['authenticated'] }],
    },
    isActivated: {
      response: [{ who: ['superuser'] }],
    },
    isSuperuser: {
      response: [{ who: ['superuser'] }],
    },
  },
});
