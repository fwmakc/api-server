import { Controller } from '@nestjs/common';
import { AccessLevel, EntityController } from 'api-server-toolkit';
import { PostsDto } from './posts.dto';
import { PostsEntity } from './posts.entity';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController extends EntityController({
  name: 'Посты',
  dto: PostsDto,
  entity: PostsEntity,
  operations: {
    read: AccessLevel.PUBLIC,
    create: AccessLevel.OWNER,
    update: AccessLevel.OWNER,
    delete: AccessLevel.OWNER,
  },
  roles: {
    update: ['editor'],
    delete: [{ role: 'admin', tenant: 'all' }],
  },
  relations: ['tags', 'category', 'account'],
})<PostsDto, PostsEntity, PostsService> {
  constructor(readonly service: PostsService) {
    super();
  }
}
