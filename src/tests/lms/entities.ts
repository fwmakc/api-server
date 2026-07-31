import {
  Entity,
  BaseEntity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IdColumn,
  VarcharColumn,
  IntColumn,
  TextColumn,
  CreatedColumn,
  BooleanColumn,
  DateColumn,
} from 'api-server-toolkit';

@Entity({ name: 'lms_students' })
export class LmsStudentEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('username', 'normal', { index: 'unique' })
  username: string;

  @VarcharColumn('full_name')
  fullName: string;

  @CreatedColumn() createdAt?: Date;

  @OneToMany(() => LmsEnrollEntity, (e) => e.student)
  enrolls: LmsEnrollEntity[];

  @OneToMany(() => LmsActivityResultEntity, (r) => r.student)
  results: LmsActivityResultEntity[];
}

@Entity({ name: 'lms_courses' })
export class LmsCourseEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('title')
  title: string;

  @TextColumn('description')
  description: string;

  @CreatedColumn() createdAt?: Date;

  @OneToMany(() => LmsFlowEntity, (f) => f.course)
  flows: LmsFlowEntity[];

  @OneToMany(() => LmsEnrollEntity, (e) => e.course)
  enrolls: LmsEnrollEntity[];

  @OneToMany(() => LmsModuleEntity, (m) => m.course)
  modules: LmsModuleEntity[];
}

@Entity({ name: 'lms_flows' })
@Index('idx_lms_flows_course', ['course'])
export class LmsFlowEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('name')
  name: string;

  @DateColumn('start_date')
  startDate?: Date;

  @IntColumn('max_students')
  maxStudents?: number;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsCourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: LmsCourseEntity;

  @OneToMany(() => LmsEnrollEntity, (e) => e.flow)
  enrolls: LmsEnrollEntity[];
}

@Entity({ name: 'lms_enrolls' })
@Index('idx_lms_enrolls_student', ['student'])
@Index('idx_lms_enrolls_course', ['course'])
@Index('idx_lms_enrolls_flow', ['flow'])
@Index('idx_lms_enrolls_student_course', ['student', 'course'])
export class LmsEnrollEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('status')
  status: string;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsStudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: LmsStudentEntity;

  @ManyToOne(() => LmsCourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: LmsCourseEntity;

  @ManyToOne(() => LmsFlowEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'flow_id' })
  flow: LmsFlowEntity;
}

@Entity({ name: 'lms_modules' })
@Index('idx_lms_modules_course', ['course'])
@Index('idx_lms_modules_parent', ['parent'])
@Index('idx_lms_modules_course_parent_pos', ['course', 'parent', 'position'])
export class LmsModuleEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('title')
  title: string;

  @IntColumn('position')
  position: number;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsCourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: LmsCourseEntity;

  @ManyToOne(() => LmsModuleEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_module_id' })
  parent: LmsModuleEntity;

  @OneToMany(() => LmsModuleEntity, (m) => m.parent)
  children: LmsModuleEntity[];

  @OneToMany(() => LmsTaskEntity, (t) => t.module)
  tasks: LmsTaskEntity[];
}

@Entity({ name: 'lms_tasks' })
@Index('idx_lms_tasks_module', ['module'])
export class LmsTaskEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('title')
  title: string;

  @IntColumn('position')
  position: number;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsModuleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: LmsModuleEntity;

  @OneToMany(() => LmsActivityEntity, (a) => a.task)
  activities: LmsActivityEntity[];
}

@Entity({ name: 'lms_activities' })
@Index('idx_lms_activities_task', ['task'])
export class LmsActivityEntity extends BaseEntity {
  @IdColumn() id: number;

  @VarcharColumn('type')
  type: string;

  @VarcharColumn('title')
  title: string;

  @IntColumn('max_score')
  maxScore: number;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsTaskEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: LmsTaskEntity;

  @OneToMany(() => LmsActivityResultEntity, (r) => r.activity)
  results: LmsActivityResultEntity[];
}

@Entity({ name: 'lms_activities_results' })
@Index('idx_lms_results_student', ['student'])
@Index('idx_lms_results_activity', ['activity'])
@Index('idx_lms_results_student_activity', ['student', 'activity'])
@Index('idx_lms_results_student_correct', ['student', 'activity', 'isCorrect'])
export class LmsActivityResultEntity extends BaseEntity {
  @IdColumn() id: number;

  @IntColumn('attempt_number')
  attemptNumber: number;

  @IntColumn('score')
  score: number;

  @BooleanColumn('is_correct')
  isCorrect: boolean;

  @CreatedColumn() createdAt?: Date;

  @ManyToOne(() => LmsStudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: LmsStudentEntity;

  @ManyToOne(() => LmsActivityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: LmsActivityEntity;
}

export const LmsEntities = [
  LmsStudentEntity,
  LmsCourseEntity,
  LmsFlowEntity,
  LmsEnrollEntity,
  LmsModuleEntity,
  LmsTaskEntity,
  LmsActivityEntity,
  LmsActivityResultEntity,
];
