import { InputType } from '@nestjs/graphql';
import { CommonDto } from '@src/common/common.dto';

@InputType()
export class TestAuthDto extends CommonDto {
  username?: string;
  email?: string;
  password?: string;
  isActivated?: boolean;
  isSuperuser?: boolean;
}

@InputType()
export class TestArticleDto extends CommonDto {
  title?: string;
  content?: string;
  secretNotes?: string;
  position?: number;
  auth?: any;
}

@InputType()
export class TestCommentDto extends CommonDto {
  text?: string;
  authorIp?: string;
  auth?: any;
  article?: any;
}

@InputType()
export class TestTagDto extends CommonDto {
  name?: string;
}

@InputType()
export class TestProfileDto extends CommonDto {
  bio?: string;
  internalNotes?: string;
  auth?: any;
}

@InputType()
export class TestCycleADto extends CommonDto {
  name?: string;
  secretA?: string;
}

@InputType()
export class TestCycleBDto extends CommonDto {
  name?: string;
  secretB?: string;
}

@InputType()
export class TestUserDto extends CommonDto {
  email?: string;
  name?: string;
}

@InputType()
export class TestNoteDto extends CommonDto {
  title?: string;
  secret?: string;
  user?: any;
}
