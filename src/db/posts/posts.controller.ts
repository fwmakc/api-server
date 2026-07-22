import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { PostsDto } from './posts.dto';
import { PostsEntity } from './posts.entity';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController extends EntityController({
  name: 'Посты',
  dto: PostsDto,
  entity: PostsEntity,
  operations: {
    read: 'public',
    create: 'owner',
    update: 'owner',
    delete: 'owner',
  },
})<PostsDto, PostsEntity, PostsService> {
  constructor(readonly service: PostsService) {
    super();
  }
}
