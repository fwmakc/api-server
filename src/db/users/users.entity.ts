import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TypeGenders } from '@src/common/common.enum';
import { AuthEntity } from '@src/auth/auth.entity';
import {
  CreatedColumn,
  DateColumn,
  EnumColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';

@ObjectType()
@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @Field(() => AuthEntity, { nullable: true })
  @OneToOne(() => AuthEntity)
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: AuthEntity;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('email')
  email?: string;

  @VarcharColumn('phone', 'tiny', { clear: '[^0-9]' })
  phone?: string;

  @VarcharColumn('name')
  name?: string;

  @VarcharColumn('last_name')
  lastName?: string;

  @VarcharColumn('parent_name')
  parentName?: string;

  @VarcharColumn('avatar', 'long')
  avatar?: string;

  @DateColumn('birthday')
  birthday?: Date;

  @VarcharColumn('locale', 'tiny')
  locale?: string;

  @VarcharColumn('address', 'medium')
  address?: string;

  @VarcharColumn('timezone', 'tiny')
  timezone?: string;

  @EnumColumn('gender', TypeGenders, TypeGenders.DEFAULT)
  gender?: TypeGenders;
}
