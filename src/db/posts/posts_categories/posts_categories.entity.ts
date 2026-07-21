import { BaseEntity, Entity, OneToMany } from 'typeorm';
import {
  CreatedColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@core/common';
import { PostsEntity } from '../posts.entity';

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

  @OneToMany(() => PostsEntity, (post) => post.category, {
    cascade: true,
  })
  posts: PostsEntity[];
}
