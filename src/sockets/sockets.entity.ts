import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { RoomsEntity } from '@src/rooms/rooms.entity';
import { UsersEntity } from '@src/db/users/users.entity';
import { AuthEntity } from '@src/auth/auth.entity';
import {
  IdColumn,
  JsonColumn,
  TextColumn,
  VarcharColumn,
} from '@src/common/common.column';

@ObjectType()
@Entity({ name: 'sockets' })
export class SocketsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @Field(() => AuthEntity, { nullable: true })
  @ManyToOne(() => AuthEntity)
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: AuthEntity;

  @VarcharColumn('name')
  name?: string;

  @JsonColumn('data')
  data?: string;

  @TextColumn('message')
  message?: string;

  @Field(() => RoomsEntity, { nullable: true })
  @ManyToOne(() => RoomsEntity, (room) => room.sockets, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'id' })
  room: UsersEntity;
}
