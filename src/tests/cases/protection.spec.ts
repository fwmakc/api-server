import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createTestModule } from '../app.testingModule';
import { TestArticleService, TestProfileService } from '../services';
import { TestArticleDto, TestProfileDto } from '../dtos';
import { TestArticleEntity, TestProfileEntity } from '../entities';
import { EntityController } from '@core/common';

const ArticleBase = EntityController({
  name: 'Articles',
  dto: TestArticleDto,
  entity: TestArticleEntity,
  accountTable: 'account',
  operations: {
    read: 'public',
    create: 'owner',
    update: 'owner',
    delete: 'owner',
  },
});
const ProfileBase = EntityController({
  name: 'Profiles',
  dto: TestProfileDto,
  entity: TestProfileEntity,
  operations: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
});

const aliceAuth = { id: 1, isSuperuser: false } as any;
const bobAuth = { id: 2, isSuperuser: false } as any;
const adminAuth = { id: 3, isSuperuser: true } as any;

describe('Protection — controller-level access control', () => {
  let moduleRef: Awaited<ReturnType<typeof createTestModule>>;
  let articleController: InstanceType<typeof ArticleBase>;
  let profileController: InstanceType<typeof ProfileBase>;

  beforeAll(async () => {
    moduleRef = await createTestModule();

    const articleService = moduleRef.get(TestArticleService);
    const profileService = moduleRef.get(TestProfileService);

    articleController = new ArticleBase();
    (articleController as any).service = articleService;

    profileController = new ProfileBase();
    (profileController as any).service = profileService;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('N12: non-owner update → NotFoundException', async () => {
    await expect(
      articleController.update(3, { title: 'Hacked' } as any, [], aliceAuth),
    ).rejects.toThrow(NotFoundException);
  });

  it('N13: non-owner remove → false', async () => {
    const result = await articleController.remove(3, aliceAuth);
    expect(result).toBe(false);
  });

  it('N14: admin update → success (own article)', async () => {
    const created: any = await articleController.create(
      { title: 'Admin Article' } as any,
      [],
      adminAuth,
    );
    expect(created).toBeDefined();

    const result: any = await articleController.update(
      created.id,
      { title: 'Admin Edit' } as any,
      [],
      adminAuth,
    );
    expect(result).toBeDefined();
    expect(result.title).toBe('Admin Edit');
  });

  it('N15: non-admin create → ForbiddenException', async () => {
    await expect(
      profileController.create({ bio: 'hack' } as any, [], aliceAuth),
    ).rejects.toThrow(ForbiddenException);
  });

  it('N16: admin create → success', async () => {
    const result: any = await profileController.create(
      { bio: 'admin created' } as any,
      [],
      adminAuth,
    );
    expect(result).toBeDefined();
    expect(result.bio).toBe('admin created');
  });

  it('N17: non-admin remove → ForbiddenException', async () => {
    await expect(profileController.remove(1, aliceAuth)).rejects.toThrow(
      ForbiddenException,
    );
  });
});