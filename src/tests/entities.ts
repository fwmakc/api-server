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
  PermissionRegistry,
  TextColumn,
  UpdatedColumn,
  VarcharColumn,
} from 'api-server-toolkit';

// Правила видимости полей (who-only). Роль-заглушка '__never__' никому не
// выдаётся — правило с ней означает «поле закрыто для всех, кроме суперюзера».
const NEVER: string[] = ['__never__'];
const EDITOR: string[] = ['editor'];

@Entity({ name: 'test_accounts' })
export class TestAccountEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('username', 'normal', { index: 'unique' })
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

  @TextColumn('secret_notes')
  secretNotes: string;

  @VarcharColumn('admin_notes')
  adminNotes: string;

  @VarcharColumn('locked_notes')
  lockedNotes: string;

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

  @VarcharColumn('admin_code')
  adminCode: string;

  @VarcharColumn('hidden_field')
  hiddenField: string;

  @IntColumn('admin_price')
  adminPrice: number;

  @VarcharColumn('locked_field')
  lockedField: string;

  @VarcharColumn('account_note')
  accountNote: string;

  @VarcharColumn('account_write')
  accountWrite: string;

  @ManyToOne(() => TestAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: TestAccountEntity;
}

@Entity({ name: 'test_dynamic' })
export class TestDynamicEntity extends BaseEntity {
  @IdColumn()
  id: number;
}

@Entity({ name: 'test_students' })
export class TestStudentEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('email')
  email: string;

  @OneToMany(() => TestEnrollEntity, (e) => e.student)
  enrolls: TestEnrollEntity[];

  @OneToOne(() => TestAccountEntity)
  @JoinColumn({ name: 'email', referencedColumnName: 'username' })
  account: TestAccountEntity;
}

@Entity({ name: 'test_courses' })
export class TestCourseEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('title')
  title: string;

  @OneToMany(() => TestEnrollEntity, (e) => e.course)
  enrolls: TestEnrollEntity[];
}

@Entity({ name: 'test_enrolls' })
export class TestEnrollEntity extends BaseEntity {
  @IdColumn()
  id: number;

  @VarcharColumn('status')
  status: string;

  @CreatedColumn()
  createdAt?: Date;

  @ManyToOne(() => TestCourseEntity, (c) => c.enrolls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'id' })
  course: TestCourseEntity;

  @ManyToOne(() => TestStudentEntity, (s) => s.enrolls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student: TestStudentEntity;
}

// ── Правила полей (видимость/запись по ролям) ──────────────────────────
// Ранее задавались декораторами @FieldAccess на entity, теперь — fields-
// конфиг сущности. Роли: editor — редактор, superuser — байпас/явное правило.

PermissionRegistry.set(TestAccountEntity, {
  fields: {
    email: { response: [{ who: ['authenticated'] }] },
  },
});

PermissionRegistry.set(TestArticleEntity, {
  fields: {
    secretNotes: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
    adminNotes: { request: [{ who: ['superuser'] }] },
    lockedNotes: { request: [{ who: NEVER }] },
  },
});

PermissionRegistry.set(TestCommentEntity, {
  fields: {
    authorIp: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
  },
});

PermissionRegistry.set(TestProfileEntity, {
  fields: {
    internalNotes: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
  },
});

PermissionRegistry.set(TestCycleAEntity, {
  fields: {
    secretA: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
  },
});

PermissionRegistry.set(TestCycleBEntity, {
  fields: {
    secretB: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
  },
});

PermissionRegistry.set(TestNoteEntity, {
  fields: {
    secret: {
      response: [{ who: EDITOR }, { who: ['superuser'] }],
      request: [{ who: EDITOR }, { who: ['superuser'] }],
    },
  },
});

PermissionRegistry.set(TestSecretEntity, {
  fields: {
    adminCode: { response: [{ who: ['superuser'] }] },
    hiddenField: { response: [{ who: NEVER }] },
    adminPrice: { request: [{ who: ['superuser'] }] },
    lockedField: { request: [{ who: NEVER }] },
    accountNote: { response: [{ who: ['authenticated'] }] },
    accountWrite: { request: [{ who: ['authenticated'] }] },
  },
});

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
  TestStudentEntity,
  TestEnrollEntity,
  TestCourseEntity,
];
