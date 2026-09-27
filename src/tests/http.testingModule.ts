import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import { EntityController, RemovePrivateFieldsInterceptor } from 'api-server-toolkit';
import { TestEntities } from './entities';
import { TestArticleEntity, TestCourseEntity, TestEnrollEntity } from './entities';
import { TestArticleDto, TestCourseDto, TestEnrollDto } from './dtos';
import { TestArticleService, TestCourseService, TestEnrollService } from './services';
import { seedDatabase } from './app.testingModule';

const TEST_SECRET = 'test-jwt-secret';

class MockJwtStrategy extends PassportStrategy(JwtStrategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: any) => {
        const auth = req?.headers?.authorization || '';
        return auth.startsWith('Bearer ') ? auth.slice(7) : null;
      },
      secretOrKey: TEST_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      isSuperuser: payload.isSuperuser,
      roles: payload.roles || [],
    };
  }
}

export const createTestToken = (
  userId: number,
  isSuperuser = false,
  roles: string[] = [],
) => jwt.sign({ id: userId, isSuperuser, roles }, TEST_SECRET);

export const ALICE_TOKEN = createTestToken(1, false, ['editor']);
export const BOB_TOKEN = createTestToken(2, false, []);
export const ADMIN_TOKEN = createTestToken(3, true, []);

const PUBLIC: any = [{ who: ['public'] }, { who: ['authenticated'] }];
const AUTHENTICATED: any = [{ who: ['authenticated'] }];
const OWNER: any = [{ who: ['authenticated'], scope: { owner: 'account.id' } }];
const SUPERUSER: any = [{ who: ['superuser'] }];

@Controller('http-public')
class HttpPublicController extends EntityController({
  name: 'http_public',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: PUBLIC, create: PUBLIC, update: PUBLIC, delete: PUBLIC },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-account')
class HttpAccountController extends EntityController({
  name: 'http_account',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: AUTHENTICATED, create: AUTHENTICATED, update: AUTHENTICATED, delete: AUTHENTICATED },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-owner')
class HttpOwnerController extends EntityController({
  name: 'http_owner',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: OWNER, create: OWNER, update: OWNER, delete: OWNER },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-admin')
class HttpAdminController extends EntityController({
  name: 'http_admin',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: PUBLIC, create: SUPERUSER, update: SUPERUSER, delete: SUPERUSER },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-admin-strict')
class HttpAdminStrictController extends EntityController({
  name: 'http_admin_strict',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: SUPERUSER, create: SUPERUSER, update: SUPERUSER, delete: SUPERUSER },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

// Операции не заданы → маршрутов нет (default deny, 404).
@Controller('http-closed')
class HttpClosedController extends EntityController({
  name: 'http_closed',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-mixed')
class HttpMixedController extends EntityController({
  name: 'http_mixed',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: PUBLIC, create: OWNER, update: SUPERUSER },
  relations: ['account', 'comments', 'comments.account', 'tags'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-courses')
class HttpCourseController extends EntityController({
  name: 'http_courses',
  dto: TestCourseDto,
  entity: TestCourseEntity,
  operations: {
    read: [{ who: ['authenticated'], scope: { owner: 'enrolls.student.account.id' } }],
    create: SUPERUSER,
    update: SUPERUSER,
    delete: SUPERUSER,
  },
  relations: ['enrolls', 'enrolls.student', 'enrolls.course', 'enrolls.student.account'],
})<TestCourseDto, TestCourseEntity, TestCourseService> {
  constructor(readonly service: TestCourseService) {
    super();
  }
}

@Controller('http-enrolls')
class HttpEnrollController extends EntityController({
  name: 'http_enrolls',
  dto: TestEnrollDto,
  entity: TestEnrollEntity,
  operations: {
    read: [{ who: ['authenticated'], scope: { owner: 'student.account.id' } }],
    create: [{ who: ['authenticated'], scope: { owner: 'student.account.id' } }],
    update: [{ who: ['authenticated'], scope: { owner: 'student.account.id' } }],
    delete: [{ who: ['authenticated'], scope: { owner: 'student.account.id' } }],
  },
  relations: ['course', 'student', 'student.account', 'course.enrolls'],
})<TestEnrollDto, TestEnrollEntity, TestEnrollService> {
  constructor(readonly service: TestEnrollService) {
    super();
  }
}

@Controller('http-partial')
class HttpPartialRelationsController extends EntityController({
  name: 'http_partial',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: PUBLIC },
  relations: ['account'],
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-no-relations')
class HttpNoRelationsController extends EntityController({
  name: 'http_no_relations',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: PUBLIC },
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-default')
class HttpDefaultController extends EntityController({
  name: 'http_default',
  dto: TestArticleDto,
  entity: TestArticleEntity,
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

export const createHttpTestApp = async (): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
}> => {
  process.env.DB_TYPE = 'postgres';

  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'root',
        password: '1234',
        database: 'api_server_http_test',
        entities: TestEntities,
        synchronize: true,
        dropSchema: true,
        logging: false,
      }),
      TypeOrmModule.forFeature(TestEntities),
      PassportModule,
    ],
    controllers: [
      HttpPublicController,
      HttpAccountController,
      HttpOwnerController,
      HttpAdminController,
      HttpAdminStrictController,
      HttpClosedController,
      HttpMixedController,
      HttpCourseController,
      HttpEnrollController,
      HttpPartialRelationsController,
      HttpNoRelationsController,
      HttpDefaultController,
    ],
    providers: [TestArticleService, TestCourseService, TestEnrollService, MockJwtStrategy],
  }).compile();

  await seedDatabase(moduleRef);

  const app = moduleRef.createNestApplication();
  app.useGlobalInterceptors(new RemovePrivateFieldsInterceptor());
  await app.init();

  return { app, moduleRef };
};
