import { BaseEntity, Entity, ManyToMany } from 'typeorm';
import {
  CreatedColumn,
  IdColumn,
  UpdatedColumn,
  VarcharColumn,
} from 'api-server-toolkit';
import { PostsEntity } from '../posts.entity';

@Entity({ name: 'posts_tags' })
export class PostsTagsEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('title')
  title?: string;

  @ManyToMany(() => PostsEntity, (post) => post.tags, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  posts: PostsEntity[];
}
