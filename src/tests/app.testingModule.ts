import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { genSalt, hash } from 'bcryptjs';
import { TestEntities } from './entities';
import {
  TestAuthService,
  TestArticleService,
  TestCommentService,
  TestTagService,
  TestProfileService,
  TestCycleAService,
  TestCycleBService,
} from './services';

export const createTestModule = async (): Promise<TestingModule> => {
  process.env.DB_TYPE = 'postgres';

  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'root',
        password: '1234',
        database: 'nestapi_test',
        entities: TestEntities,
        synchronize: true,
        dropSchema: true,
        logging: false,
      }),
      TypeOrmModule.forFeature(TestEntities),
    ],
    providers: [
      TestAuthService,
      TestArticleService,
      TestCommentService,
      TestTagService,
      TestProfileService,
      TestCycleAService,
      TestCycleBService,
    ],
  }).compile();

  await seedDatabase(moduleRef);

  return moduleRef;
};

const seedDatabase = async (moduleRef: TestingModule) => {
  const dataSource = moduleRef.get(DataSource);

  const authRepo = dataSource.getRepository('TestAuthEntity');
  const articleRepo = dataSource.getRepository('TestArticleEntity');
  const commentRepo = dataSource.getRepository('TestCommentEntity');
  const tagRepo = dataSource.getRepository('TestTagEntity');
  const profileRepo = dataSource.getRepository('TestProfileEntity');
  const cycleARepo = dataSource.getRepository('TestCycleAEntity');
  const cycleBRepo = dataSource.getRepository('TestCycleBEntity');

  const [alice, bob, admin] = await authRepo.save([
    authRepo.create({ id: 1, username: 'alice@test', email: 'alice@test', password: await hash('password123', await genSalt(10)), isActivated: true, isSuperuser: false }),
    authRepo.create({ id: 2, username: 'bob@test', email: 'bob@test', password: await hash('password123', await genSalt(10)), isActivated: true, isSuperuser: false }),
    authRepo.create({ id: 3, username: 'admin@test', email: 'admin@test', password: await hash('password123', await genSalt(10)), isActivated: true, isSuperuser: true }),
  ]);

  const [art1, art2, art3] = await articleRepo.save([
    articleRepo.create({ id: 1, auth: alice, title: 'Alice Post 1', content: 'Content 1', secretNotes: 'alice secret 1', position: 1 }),
    articleRepo.create({ id: 2, auth: alice, title: 'Alice Post 2', content: 'Content 2', secretNotes: 'alice secret 2', position: 2 }),
    articleRepo.create({ id: 3, auth: bob, title: 'Bob Post', content: 'Content 3', secretNotes: 'bob secret', position: 1 }),
  ]);

  await commentRepo.save([
    commentRepo.create({ id: 1, auth: alice, article: art1, text: 'Alice comment on own post', authorIp: '127.0.0.1' }),
    commentRepo.create({ id: 2, auth: bob, article: art1, text: 'Bob comment on Alice post', authorIp: '192.168.1.1' }),
  ]);

  const [tagNews, tagTech] = await tagRepo.save([
    tagRepo.create({ id: 1, name: 'news' }),
    tagRepo.create({ id: 2, name: 'tech' }),
  ]);

  art1.tags = [tagNews];
  art2.tags = [tagNews];
  art3.tags = [tagTech];
  await articleRepo.save([art1, art2, art3]);

  await profileRepo.save([
    profileRepo.create({ id: 1, auth: alice, bio: 'Alice bio', internalNotes: 'admin note: alice is VIP' }),
    profileRepo.create({ id: 2, auth: bob, bio: 'Bob bio', internalNotes: 'admin note: bob is banned' }),
  ]);

  const cycleA = cycleARepo.create({ id: 1, name: 'Cycle A1', secretA: 'secret from A' });
  await cycleARepo.save(cycleA);

  const cycleB = cycleBRepo.create({ id: 1, name: 'Cycle B1', secretB: 'secret from B', a: cycleA });
  await cycleBRepo.save(cycleB);

  cycleA.b = cycleB;
  await cycleARepo.save(cycleA);
};
