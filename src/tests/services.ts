import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '@src/common/common.service';
import { RelationsDto } from '@src/common/dto/relations.dto';
import { BindDto } from '@src/common/dto/bind.dto';
import {
  TestAuthEntity,
  TestArticleEntity,
  TestCommentEntity,
  TestTagEntity,
  TestProfileEntity,
  TestCycleAEntity,
  TestCycleBEntity,
  TestUserEntity,
  TestNoteEntity,
} from './entities';
import {
  TestAuthDto,
  TestArticleDto,
  TestCommentDto,
  TestTagDto,
  TestProfileDto,
  TestCycleADto,
  TestCycleBDto,
  TestUserDto,
  TestNoteDto,
} from './dtos';

@Injectable()
export class TestAuthService extends CommonService<TestAuthDto, TestAuthEntity> {
  constructor(
    @InjectRepository(TestAuthEntity)
    protected readonly repository: Repository<TestAuthEntity>,
  ) {
    super();
  }

  async create(
    dto: TestAuthDto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<TestAuthEntity> {
    delete dto.isSuperuser;
    return await super.create(dto, relations, bind);
  }

  async update(
    id: number,
    dto: TestAuthDto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<TestAuthEntity> {
    delete dto.isSuperuser;
    return await super.update(id, dto, relations, bind);
  }

  async findByUsername(username: string): Promise<TestAuthEntity> {
    return await this.repository.findOneBy({ username });
  }

  async login(username: string, password: string): Promise<TestAuthEntity> {
    const auth = await this.findByUsername(username);
    if (!auth) {
      throw new UnauthorizedException('User not found');
    }
    const isValidPassword = await compare(password, auth.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }
    if (!auth.isActivated) {
      throw new UnauthorizedException('Not activated');
    }
    return auth;
  }
}

@Injectable()
export class TestArticleService extends CommonService<TestArticleDto, TestArticleEntity> {
  constructor(
    @InjectRepository(TestArticleEntity)
    protected readonly repository: Repository<TestArticleEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCommentService extends CommonService<TestCommentDto, TestCommentEntity> {
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
export class TestProfileService extends CommonService<TestProfileDto, TestProfileEntity> {
  constructor(
    @InjectRepository(TestProfileEntity)
    protected readonly repository: Repository<TestProfileEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCycleAService extends CommonService<TestCycleADto, TestCycleAEntity> {
  constructor(
    @InjectRepository(TestCycleAEntity)
    protected readonly repository: Repository<TestCycleAEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestCycleBService extends CommonService<TestCycleBDto, TestCycleBEntity> {
  constructor(
    @InjectRepository(TestCycleBEntity)
    protected readonly repository: Repository<TestCycleBEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestUserService extends CommonService<TestUserDto, TestUserEntity> {
  constructor(
    @InjectRepository(TestUserEntity)
    protected readonly repository: Repository<TestUserEntity>,
  ) {
    super();
  }
}

@Injectable()
export class TestNoteService extends CommonService<TestNoteDto, TestNoteEntity> {
  constructor(
    @InjectRepository(TestNoteEntity)
    protected readonly repository: Repository<TestNoteEntity>,
  ) {
    super();
  }
}
