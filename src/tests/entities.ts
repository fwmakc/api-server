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
  IdColumn,
  IntColumn,
  TextColumn,
  UpdatedColumn,
  VarcharColumn,
} from '@core/common';
import { FieldAccess } from '@core/common';

@Entity({ name: 'test_accounts' })
export class TestAccountEntity extends BaseEntity {
  @IdColumn()
  id: number;

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

@Entity({ name: 'test_articles' })
export class TestArticleEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @CreatedColumn()
  createdAt?: Date;

  @UpdatedColumn()
  updatedAt?: Date;

  @VarcharColumn('title')
  title: string;

  @TextColumn('content')
  content: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @TextColumn('secret_notes')
  secretNotes: string;

  @IntColumn('position')
  position: number;

  @ManyToOne(() => TestAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: TestAccountEntity;

  @OneToMany(() => TestCommentEntity, (comment) => comment.article)
  comments: TestCommentEntity[];

  @ManyToMany(() => TestTagEntity, (tag) => tag.articles)
  @JoinTable({ name: 'test_articles_tags' })
  tags: TestTagEntity[];
}

@Entity({ name: 'test_comments' })
export class TestCommentEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('text')
  text: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @VarcharColumn('author_ip')
  authorIp: string;

  @ManyToOne(() => TestAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: TestAccountEntity;

  @ManyToOne(() => TestArticleEntity, (article) => article.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: TestArticleEntity;
}

@Entity({ name: 'test_tags' })
export class TestTagEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name')
  name: string;

  @ManyToMany(() => TestArticleEntity, (article) => article.tags)
  articles: TestArticleEntity[];
}

@Entity({ name: 'test_profiles' })
export class TestProfileEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @TextColumn('bio')
  bio: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @TextColumn('internal_notes')
  internalNotes: string;

  @OneToOne(() => TestAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: TestAccountEntity;
}

@Entity({ name: 'test_cycle_a' })
export class TestCycleAEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name')
  name: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @VarcharColumn('secret_a')
  secretA: string;

  @OneToOne(() => TestCycleBEntity, (b) => b.a, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'b_id', referencedColumnName: 'id' })
  b: any;
}

@Entity({ name: 'test_cycle_b' })
export class TestCycleBEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name')
  name: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @VarcharColumn('secret_b')
  secretB: string;

  @OneToOne(() => TestCycleAEntity, (a) => a.b, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'a_id', referencedColumnName: 'id' })
  a: any;
}

@Entity({ name: 'test_users' })
export class TestUserEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('email', 'normal', { index: 'unique' })
  email: string;

  @VarcharColumn('name')
  name: string;
}

@Entity({ name: 'test_notes' })
export class TestNoteEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('title')
  title: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  @TextColumn('secret')
  secret: string;

  @ManyToOne(() => TestUserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: TestUserEntity;
}

@Entity({ name: 'test_secrets' })
export class TestSecretEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('name')
  name: string;

  @FieldAccess({ read: 'admin' })
  @VarcharColumn('admin_code')
  adminCode: string;

  @FieldAccess({ read: 'closed' })
  @VarcharColumn('hidden_field')
  hiddenField: string;

  @FieldAccess({ write: 'admin' })
  @IntColumn('admin_price')
  adminPrice: number;

  @FieldAccess({ write: 'closed' })
  @VarcharColumn('locked_field')
  lockedField: string;

  @ManyToOne(() => TestAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: TestAccountEntity;
}

@Entity({ name: 'test_dynamic' })
export class TestDynamicEntity extends BaseEntity {
  @IdColumn()
  id: number;
}

export const TestEntities = [
  TestAccountEntity,
  TestArticleEntity,
  TestCommentEntity,
  TestTagEntity,
  TestProfileEntity,
  TestCycleAEntity,
  TestCycleBEntity,
  TestUserEntity,
  TestNoteEntity,
  TestSecretEntity,
  TestDynamicEntity,
];