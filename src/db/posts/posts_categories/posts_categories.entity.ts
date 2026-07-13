import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Entity, OneToMany } from 'typeorm';
import {
  CreatedColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';
import { PostsEntity } from '../posts.entity';

@ObjectType()
@Entity({ name: 'posts_categories' })
export class PostsCategoriesEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('title')
  title?: string;

  @Field(() => [PostsEntity], { nullable: true })
  @OneToMany(() => PostsEntity, (post) => post.category, {
    cascade: true,
  })
  posts: PostsEntity[];
}
