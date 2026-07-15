import { IsEmail, IsString, MinLength } from 'class-validator';
import {
  DtoColumn,
  DtoCreatedColumn,
  DtoUpdatedColumn,
} from '@src/common/common.column';
import { CommonDto } from '@src/common/common.dto';

export class AccountDto extends CommonDto {
  @DtoCreatedColumn()
  createdAt?: Date;

  @DtoUpdatedColumn()
  updatedAt?: Date;

  @IsEmail()
  @DtoColumn('Имя пользователя, обычно здесь используется email', {
    required: true,
  })
  username?: string;

  @MinLength(6, {
    message: 'Password cannot be less than 6 symbols!',
  })
  @IsString()
  @DtoColumn('Пароль, заданный пользователем')
  password?: string;

  @DtoColumn(
    'Флаг, который показывает, является ли учетная запись пользователя активированной. Например, подтвержденной по email.',
    { default: false },
  )
  isActivated?: boolean;

  @DtoColumn(
    'Флаг, который показывает, назначены ли учетной записи пользователя права суперпользователя (администратора).',
    { required: false },
  )
  isSuperuser?: boolean;
}
