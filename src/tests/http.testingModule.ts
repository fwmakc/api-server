import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import { EntityController } from '@core/common';
import { TestEntities } from './entities';
import { TestArticleEntity } from './entities';
import { TestArticleDto } from './dtos';
import { TestArticleService } from './services';
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
    return { id: payload.id, isSuperuser: payload.isSuperuser };
  }
}

export const createTestToken = (userId: number, isSuperuser: boolean) =>
  jwt.sign({ id: userId, isSuperuser }, TEST_SECRET);

export const ALICE_TOKEN = createTestToken(1, false);
export const BOB_TOKEN = createTestToken(2, false);
export const ADMIN_TOKEN = createTestToken(3, true);

@Controller('http-public')
class HttpPublicController extends EntityController({
  name: 'http_public',
  dto: TestArticleDto,
  entity: TestArticleEntity,
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
  operations: { read: 'account', create: 'account', update: 'account', delete: 'account' },
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
  operations: { read: 'owner', create: 'owner', update: 'owner', delete: 'owner' },
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
  operations: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
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
  operations: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
})<TestArticleDto, TestArticleEntity, TestArticleService> {
  constructor(readonly service: TestArticleService) {
    super();
  }
}

@Controller('http-closed')
class HttpClosedController extends EntityController({
  name: 'http_closed',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  operations: { read: 'closed', create: 'closed', update: 'closed', delete: 'closed' },
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
  operations: { read: 'public', create: 'owner', update: 'admin', delete: 'closed' },
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
    ],
    providers: [TestArticleService, MockJwtStrategy],
  }).compile();

  await seedDatabase(moduleRef);

  const app = moduleRef.createNestApplication();
  await app.init();

  return { app, moduleRef };
};
