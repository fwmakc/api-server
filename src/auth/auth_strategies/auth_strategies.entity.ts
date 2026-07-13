import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  CreatedColumn,
  IdColumn,
  JsonColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';
import { AuthEntity } from '../auth.entity';

@ObjectType()
@Entity({ name: 'auth_strategies' })
@Index(['name', 'uid'], { unique: true })
export class AuthStrategiesEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('name')
  name: string;

  @VarcharColumn('uid')
  uid: string;

  @JsonColumn('json')
  json?: string;

  @VarcharColumn('access_token', 'long')
  accessToken?: string;

  @VarcharColumn('refresh_token', 'long')
  refreshToken?: string;

  @Field(() => AuthEntity, { nullable: true })
  @ManyToOne(() => AuthEntity, (auth) => auth.strategies, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: AuthEntity;
}
