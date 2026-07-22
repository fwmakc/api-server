import { CommonDto } from 'api-server-toolkit';

export class TestAccountDto extends CommonDto {
  username?: string;
  email?: string;
  password?: string;
  isActivated?: boolean;
  isSuperuser?: boolean;
}

export class TestArticleDto extends CommonDto {
  title?: string;
  content?: string;
  secretNotes?: string;
  position?: number;
  account?: any;
}

export class TestCommentDto extends CommonDto {
  text?: string;
  authorIp?: string;
  account?: any;
  article?: any;
}

export class TestTagDto extends CommonDto {
  name?: string;
}

export class TestProfileDto extends CommonDto {
  bio?: string;
  internalNotes?: string;
  account?: any;
}

export class TestCycleADto extends CommonDto {
  name?: string;
  secretA?: string;
}

export class TestCycleBDto extends CommonDto {
  name?: string;
  secretB?: string;
}

export class TestUserDto extends CommonDto {
  email?: string;
  name?: string;
}

export class TestNoteDto extends CommonDto {
  title?: string;
  secret?: string;
  user?: any;
}

export class TestSecretDto extends CommonDto {
  name?: string;
  adminCode?: string;
  hiddenField?: string;
  adminPrice?: number;
  lockedField?: string;
  account?: any;
}

export class TestDynamicDto extends CommonDto {}

export class TestCourseDto extends CommonDto {
  title?: string;
}

export class TestEnrollDto extends CommonDto {
  status?: string;
  course?: any;
  student?: any;
}