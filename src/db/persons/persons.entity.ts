import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, JoinColumn, ManyToOne } from 'typeorm';
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
@Entity({ name: 'persons' })
export class PersonsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @Field(() => AuthEntity, { nullable: true })
  @ManyToOne(() => AuthEntity)
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: AuthEntity;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('username', 'normal', { index: 'unique' })
  username: string;

  @VarcharColumn('password')
  password: string;

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

  @Field(() => TypeGenders, {
    nullable: true,
    defaultValue: TypeGenders.DEFAULT,
  })
  @EnumColumn('gender', TypeGenders, TypeGenders.MAN)
  gender?: TypeGenders;
}
