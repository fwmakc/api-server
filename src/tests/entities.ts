import { Field, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  BaseEntity,
  ManyToOne,
  OneToMany,
  ManyToMany,
  OneToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import {
  BooleanColumn,
  CreatedColumn,
  IntColumn,
  TextColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@src/common/common.column';
import { CommonEntity } from '@src/common/common.entity';
import { PrivateColumn } from '@src/common/decorator/private_column.decorator';

@ObjectType()
@Entity({ name: 'test_auth' })
export class TestAuthEntity extends CommonEntity {
  @VarcharColumn('username')
  username: string;

  @VarcharColumn('email')
  email: string;

  @VarcharColumn('password')
  password: string;

  @BooleanColumn('is_activated')
  isActivated: boolean;

  @BooleanColumn('is_superuser')
  isSuperuser: boolean;
}

@ObjectType()
@Entity({ name: 'test_articles' })
export class TestArticleEntity extends CommonEntity {
  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('title')
  title: string;

  @TextColumn('content')
  content: string;

  @PrivateColumn()
  @TextColumn('secret_notes')
  secretNotes: string;

  @IntColumn('position')
  position: number;

  @Field(() => TestAuthEntity, { nullable: true })
  @ManyToOne(() => TestAuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: TestAuthEntity;

  @Field(() => [TestCommentEntity], { nullable: true })
  @OneToMany(() => TestCommentEntity, (comment) => comment.article)
  comments: TestCommentEntity[];

  @Field(() => [TestTagEntity], { nullable: true })
  @ManyToMany(() => TestTagEntity, (tag) => tag.articles)
  @JoinTable({ name: 'test_articles_tags' })
  tags: TestTagEntity[];
}

@ObjectType()
@Entity({ name: 'test_comments' })
export class TestCommentEntity extends CommonEntity {
  @VarcharColumn('text')
  text: string;

  @PrivateColumn()
  @VarcharColumn('author_ip')
  authorIp: string;

  @Field(() => TestAuthEntity, { nullable: true })
  @ManyToOne(() => TestAuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: TestAuthEntity;

  @Field(() => TestArticleEntity, { nullable: true })
  @ManyToOne(() => TestArticleEntity, (article) => article.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: TestArticleEntity;
}

@ObjectType()
@Entity({ name: 'test_tags' })
export class TestTagEntity extends CommonEntity {
  @VarcharColumn('name')
  name: string;

  @Field(() => [TestArticleEntity], { nullable: true })
  @ManyToMany(() => TestArticleEntity, (article) => article.tags)
  articles: TestArticleEntity[];
}

@ObjectType()
@Entity({ name: 'test_profiles' })
export class TestProfileEntity extends CommonEntity {
  @TextColumn('bio')
  bio: string;

  @PrivateColumn()
  @TextColumn('internal_notes')
  internalNotes: string;

  @Field(() => TestAuthEntity, { nullable: true })
  @OneToOne(() => TestAuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
  auth: TestAuthEntity;
}

@ObjectType()
@Entity({ name: 'test_cycle_a' })
export class TestCycleAEntity extends CommonEntity {
  @VarcharColumn('name')
  name: string;

  @PrivateColumn()
  @VarcharColumn('secret_a')
  secretA: string;

  @OneToOne(() => TestCycleBEntity, (b) => b.a, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'b_id', referencedColumnName: 'id' })
  b: any;
}

@ObjectType()
@Entity({ name: 'test_cycle_b' })
export class TestCycleBEntity extends CommonEntity {
  @VarcharColumn('name')
  name: string;

  @PrivateColumn()
  @VarcharColumn('secret_b')
  secretB: string;

  @OneToOne(() => TestCycleAEntity, (a) => a.b, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'a_id', referencedColumnName: 'id' })
  a: any;
}

export const TestEntities = [
  TestAuthEntity,
  TestArticleEntity,
  TestCommentEntity,
  TestTagEntity,
  TestProfileEntity,
  TestCycleAEntity,
  TestCycleBEntity,
];
