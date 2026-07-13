import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  // Generated,
} from 'typeorm';
import {
  BooleanColumn,
  CreatedColumn,
  EnumColumn,
  IdColumn,
  TextColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';
import { TypeClients } from '@src/common/common.enum';
import { AuthEntity } from '@src/auth/auth.entity';
import { ClientsRedirectsEntity } from './clients_redirects/clients_redirects.entity';

@ObjectType()
@Entity({ name: 'clients' })
export class ClientsEntity extends BaseEntity {
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

  @Field({ nullable: true })
  @VarcharColumn('client_id', 'normal', { index: 'unique' })
  client_id: string;

  @VarcharColumn('client_secret', 'long')
  client_secret: string;

  @VarcharColumn('client_password', 'long')
  client_password: string;

  @EnumColumn('client_type', TypeClients, TypeClients.DEFAULT)
  client_type?: TypeClients;

  @VarcharColumn('title')
  title: string;

  @TextColumn('description')
  description: string;

  @VarcharColumn('client_uri', 'long')
  client_uri: string;

  @VarcharColumn('code', 'long')
  code: string;

  @CreatedColumn('published_at')
  publishedAt: Date;

  @BooleanColumn('is_published', true)
  isPublished: boolean;

  @Field(() => [ClientsRedirectsEntity], { nullable: true })
  @OneToMany(() => ClientsRedirectsEntity, (redirect) => redirect.client, {
    cascade: true,
  })
  redirects: ClientsRedirectsEntity[];
}
