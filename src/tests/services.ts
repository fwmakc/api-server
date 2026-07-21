import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '@core/common';
import { DynamicService } from '@core/common';
import { RelationsDto } from '@core/common';
import { BindDto } from '@core/common';
import {
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
} from './entities';
import {
  TestAccountDto,
  TestArticleDto,
  TestCommentDto,
  TestTagDto,
  TestProfileDto,
  TestCycleADto,
  TestCycleBDto,
  TestUserDto,
  TestNoteDto,
  TestSecretDto,
  TestDynamicDto,
} from './dtos';

@Injectable()
export class TestAccountService extends CommonService<
  TestAccountDto,
  TestAccountEntity
> {
  constructor(
    @InjectRepository(TestAccountEntity)
    protected readonly repository: Repository<TestAccountEntity>,
  ) {
    super();
  }

  async create(
    dto: TestAccountDto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<TestAccountEntity> {
    delete dto.isSuperuser;
    return await super.create(dto, relations, bind);
  }

  async update(
    id: number,
    dto: TestAccountDto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<TestAccountEntity> {
    delete dto.isSuperuser;
    return await super.update(id, dto, relations, bind);
  }

  async findByUsername(username: string): Promise<TestAccountEntity> {
    return await this.repository.findOneBy({ username });
  }

  async login(username: string, password: string): Promise<TestAccountEntity> {
    const account = await this.findByUsername(username);
    if (!account) {
      throw new UnauthorizedException('User not found');
    }
    const isValidPassword = await compare(password, account.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    if (!account.isActivated) {
      throw new UnauthorizedException('Not activated');
    }
    return account;
  }
}

@Injectable()
export class TestArticleService extends CommonService<
  TestArticleDto,
  TestArticleEntity
> {
  constructor(
    @InjectRepository(TestArticleEntity)
    protected readonly repository: Repository<TestArticleEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCommentService extends CommonService<
  TestCommentDto,
  TestCommentEntity
> {
  constructor(
    @InjectRepository(TestCommentEntity)
    protected readonly repository: Repository<TestCommentEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestTagService extends CommonService<TestTagDto, TestTagEntity> {
  constructor(
    @InjectRepository(TestTagEntity)
    protected readonly repository: Repository<TestTagEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestProfileService extends CommonService<
  TestProfileDto,
  TestProfileEntity
> {
  constructor(
    @InjectRepository(TestProfileEntity)
    protected readonly repository: Repository<TestProfileEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCycleAService extends CommonService<
  TestCycleADto,
  TestCycleAEntity
> {
  constructor(
    @InjectRepository(TestCycleAEntity)
    protected readonly repository: Repository<TestCycleAEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCycleBService extends CommonService<
  TestCycleBDto,
  TestCycleBEntity
> {
  constructor(
    @InjectRepository(TestCycleBEntity)
    protected readonly repository: Repository<TestCycleBEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestUserService extends CommonService<
  TestUserDto,
  TestUserEntity
> {
  constructor(
    @InjectRepository(TestUserEntity)
    protected readonly repository: Repository<TestUserEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestNoteService extends CommonService<
  TestNoteDto,
  TestNoteEntity
> {
  constructor(
    @InjectRepository(TestNoteEntity)
    protected readonly repository: Repository<TestNoteEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestSecretService extends CommonService<
  TestSecretDto,
  TestSecretEntity
> {
  constructor(
    @InjectRepository(TestSecretEntity)
    protected readonly repository: Repository<TestSecretEntity>,
  ) {
    super();
  }
}

@Injectable()
export class DynamicTestService extends DynamicService<
  TestDynamicDto,
  TestDynamicEntity
> {
  constructor(
    @InjectRepository(TestDynamicEntity)
    protected readonly repository: Repository<any>,
  ) {
    super();
  }
}