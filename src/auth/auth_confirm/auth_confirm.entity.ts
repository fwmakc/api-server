import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  CreatedColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';
import { AuthEntity } from '../auth.entity';

@ObjectType()
@Entity({ name: 'auth_confirm' })
export class AuthConfirmEntity extends BaseEntity {
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

  @VarcharColumn('code', 'long')
  code: string;

  @VarcharColumn('code', 'tiny')
  type: string;
}
