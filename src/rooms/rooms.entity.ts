import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, OneToMany } from 'typeorm';
import { IdColumn, VarcharColumn } from '@src/common/common.column';
import { SocketsEntity } from '@src/sockets/sockets.entity';

@ObjectType()
@Entity({ name: 'rooms' })
export class RoomsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('title')
  title?: string;

  @Field(() => [SocketsEntity], { nullable: true })
  @OneToMany(() => SocketsEntity, (socket) => socket.room, {
    cascade: true,
  })
  sockets: SocketsEntity[];
}
