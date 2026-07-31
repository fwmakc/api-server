import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { batchLoadRelations } from 'api-server-toolkit';
import {
  LmsStudentEntity,
  LmsCourseEntity,
  LmsEnrollEntity,
  LmsModuleEntity,
  LmsTaskEntity,
  LmsActivityEntity,
  LmsActivityResultEntity,
  LmsEntities,
} from './entities';

jest.setTimeout(600000);

describe('LMS Performance', () => {
  let moduleRef: TestingModule;
  let ds: DataSource;
  let studentRepo: Repository<LmsStudentEntity>;
  let courseRepo: Repository<LmsCourseEntity>;
  let enrollRepo: Repository<LmsEnrollEntity>;
  let moduleRepo: Repository<LmsModuleEntity>;
  let taskRepo: Repository<LmsTaskEntity>;
  let activityRepo: Repository<LmsActivityEntity>;
  let resultRepo: Repository<LmsActivityResultEntity>;

  const results: { query: string; approach: string; ms: number; rows: number }[] = [];

  function record(query: string, approach: string, ms: number, rows: number) {
    results.push({ query, approach, ms, rows });
    console.log(`  ${approach.padEnd(8)} ${ms.toFixed(0).padStart(6)}ms  ${rows} rows`);
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'root',
          password: '1234',
          database: 'api_server_test',
          entities: LmsEntities,
          synchronize: true,
          dropSchema: false,
          logging: false,
        }),
        TypeOrmModule.forFeature(LmsEntities),
      ],
    }).compile();

    ds = moduleRef.get(DataSource);
    studentRepo = ds.getRepository(LmsStudentEntity);
    courseRepo = ds.getRepository(LmsCourseEntity);
    enrollRepo = ds.getRepository(LmsEnrollEntity);
    moduleRepo = ds.getRepository(LmsModuleEntity);
    taskRepo = ds.getRepository(LmsTaskEntity);
    activityRepo = ds.getRepository(LmsActivityEntity);
    resultRepo = ds.getRepository(LmsActivityResultEntity);

    const count = await ds.query('SELECT count(*)::int as n FROM lms_activities_results');
    if (count[0].n === 0) {
      console.log('  Seeding LMS data...');
      await ds.query('TRUNCATE TABLE lms_activities_results, lms_activities, lms_tasks, lms_modules, lms_enrolls, lms_flows, lms_courses, lms_students RESTART IDENTITY CASCADE');
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
      const cleanSql = seedSql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');
      const statements = cleanSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        const desc = stmt.slice(0, 60).replace(/\n/g, ' ');
        const s0 = performance.now();
        await ds.query(stmt);
        console.log(`    ${(performance.now() - s0).toFixed(0)}ms  ${desc}...`);
      }
      console.log('  Seed complete.');
    }

    const counts = await ds.query(`
      SELECT
        (SELECT count(*) FROM lms_students) AS students,
        (SELECT count(*) FROM lms_courses) AS courses,
        (SELECT count(*) FROM lms_enrolls) AS enrolls,
        (SELECT count(*) FROM lms_modules) AS modules,
        (SELECT count(*) FROM lms_tasks) AS tasks,
        (SELECT count(*) FROM lms_activities) AS activities,
        (SELECT count(*) FROM lms_activities_results) AS results
    `);
    console.log('  Data volumes:', counts[0]);
  });

  afterAll(async () => {
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│                  PERFORMANCE RESULTS                     │');
    console.log('├──────────────────────────────────────┬──────────┬────────┤');
    console.log('│ Query                                │ Time(ms) │  Rows  │');
    console.log('├──────────────────────────────────────┼──────────┼────────┤');
    for (const r of results) {
      const q = (r.query + ' (' + r.approach + ')').padEnd(38).slice(0, 38);
      const ms = r.ms.toFixed(0).padStart(8);
      const rows = String(r.rows).padStart(6);
      console.log(`│ ${q} │ ${ms} │ ${rows} │`);
    }
    console.log('└──────────────────────────────────────┴──────────┴────────┘');
    await moduleRef.close();
  });

  describe('Old approach (TypeORM find with mega-JOIN)', () => {
    it('Q1: Tasks for student (deep chain: task→module→course→enroll→student)', async () => {
      const t0 = performance.now();
      const rows = await taskRepo.find({
        relations: { module: true, activities: { results: true } },
        where: { module: { course: { enrolls: { student: { id: 1 } } } } },
        take: 20,
        order: { id: 'ASC' },
      });
      record('Q1: Student tasks', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q2: Students without results in course (anti-join)', async () => {
      const t0 = performance.now();
      const rows = await studentRepo
        .createQueryBuilder('s')
        .leftJoin('s.enrolls', 'e', 'e.course_id = 1')
        .where('e.course_id = 1')
        .andWhere(
          `NOT EXISTS (
            SELECT 1 FROM lms_activities_results ar
            WHERE ar.student_id = s.id
          )`,
        )
        .take(20)
        .getMany();
      record('Q2: Anti-join', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q3: Course tree (modules→tasks→activities, 3 levels)', async () => {
      const t0 = performance.now();
      const rows = await courseRepo.find({
        relations: { modules: { tasks: { activities: true } } },
        where: { id: 1 },
      });
      record('Q3: Course tree', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q4: Student results with activity chain (results→activity→task→module)', async () => {
      const t0 = performance.now();
      const rows = await resultRepo.find({
        relations: { activity: { task: { module: true } } },
        where: { student: { id: 1 } },
        take: 50,
        order: { id: 'ASC' },
      });
      record('Q4: Results chain', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q5: Tasks with module+course (m2o chain, paginated)', async () => {
      const t0 = performance.now();
      const rows = await taskRepo.find({
        relations: { module: { course: true } },
        take: 50,
        order: { id: 'ASC' },
      });
      record('Q5: Tasks m2o', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q6: Paginated students with enrollments', async () => {
      const t0 = performance.now();
      const rows = await studentRepo.find({
        relations: { enrolls: true },
        take: 20,
        skip: 0,
        order: { id: 'ASC' },
      });
      record('Q6: Students+enrolls', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q7: Full deep load (course→modules→tasks→activities→results)', async () => {
      const t0 = performance.now();
      const rows = await courseRepo.find({
        relations: { modules: { tasks: { activities: { results: true } } } },
        where: { id: 1 },
      });
      record('Q7: Full deep load', 'OLD', performance.now() - t0, rows.length);
    });

    it('Q8: Activities with results for course', async () => {
      const t0 = performance.now();
      const rows = await activityRepo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.results', 'r')
        .leftJoin('a.task', 't')
        .leftJoin('t.module', 'm')
        .where('m.course_id = 1')
        .take(100)
        .getMany();
      record('Q8: Activities+results', 'OLD', performance.now() - t0, rows.length);
    });
  });

  describe('New approach (batch loading)', () => {
    it('Q1: Tasks for student (deep chain)', async () => {
      const t0 = performance.now();
      const taskIds = await taskRepo
        .createQueryBuilder('t')
        .innerJoin('t.module', 'm')
        .innerJoin('m.course', 'c')
        .innerJoin('c.enrolls', 'e')
        .where('e.student_id = 1')
        .select(['t.id'])
        .take(20)
        .orderBy('t.id', 'ASC')
        .getMany();
      const rows = await taskRepo.find({
        where: { id: In(taskIds.map((t) => t.id)) },
        order: { id: 'ASC' },
      });
      await batchLoadRelations(
        rows,
        ['module', 'activities.results'],
        taskRepo.metadata,
        ds.manager,
      );
      record('Q1: Student tasks', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q3: Course tree (modules→tasks→activities)', async () => {
      const t0 = performance.now();
      const rows = await courseRepo.find({ where: { id: 1 } });
      await batchLoadRelations(
        rows,
        ['modules.tasks.activities'],
        courseRepo.metadata,
        ds.manager,
      );
      record('Q3: Course tree', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q4: Student results with activity chain', async () => {
      const t0 = performance.now();
      const rows = await resultRepo.find({
        where: { student: { id: 1 } as any },
        take: 50,
        order: { id: 'ASC' },
      });
      await batchLoadRelations(
        rows,
        ['activity.task.module'],
        resultRepo.metadata,
        ds.manager,
      );
      record('Q4: Results chain', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q5: Tasks with module+course (m2o chain)', async () => {
      const t0 = performance.now();
      const rows = await taskRepo.find({
        take: 50,
        order: { id: 'ASC' },
      });
      await batchLoadRelations(
        rows,
        ['module.course'],
        taskRepo.metadata,
        ds.manager,
      );
      record('Q5: Tasks m2o', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q6: Paginated students with enrollments', async () => {
      const t0 = performance.now();
      const rows = await studentRepo.find({
        take: 20,
        order: { id: 'ASC' },
      });
      await batchLoadRelations(
        rows,
        ['enrolls'],
        studentRepo.metadata,
        ds.manager,
      );
      record('Q6: Students+enrolls', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q7: Full deep load (course→modules→tasks→activities→results)', async () => {
      const t0 = performance.now();
      const rows = await courseRepo.find({ where: { id: 1 } });
      await batchLoadRelations(
        rows,
        ['modules.tasks.activities.results'],
        courseRepo.metadata,
        ds.manager,
      );
      record('Q7: Full deep load', 'NEW', performance.now() - t0, rows.length);
    });

    it('Q8: Activities with results for course', async () => {
      const t0 = performance.now();
      const rows = await activityRepo
        .createQueryBuilder('a')
        .leftJoin('a.task', 't')
        .leftJoin('t.module', 'm')
        .where('m.course_id = 1')
        .select(['a.id'])
        .take(100)
        .getMany();
      const fullRows = await activityRepo.find({
        where: { id: In(rows.map((r) => r.id)) },
      });
      await batchLoadRelations(
        fullRows,
        ['results'],
        activityRepo.metadata,
        ds.manager,
      );
      record('Q8: Activities+results', 'NEW', performance.now() - t0, fullRows.length);
    });
  });
});
