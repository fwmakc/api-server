import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { PostsTagsDto } from './posts_tags.dto';
import { PostsTagsEntity } from './posts_tags.entity';
import { PostsTagsService } from './posts_tags.service';

@Controller('posts/tags')
export class PostsTagsController extends EntityController({
  name: 'Теги постов',
  dto: PostsTagsDto,
  entity: PostsTagsEntity,
  operations: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})<PostsTagsDto, PostsTagsEntity, PostsTagsService> {
  constructor(readonly service: PostsTagsService) {
    super();
  }
}
