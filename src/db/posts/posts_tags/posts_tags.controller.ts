import { Controller } from '@nestjs/common';
import { AccessLevel, EntityController } from 'api-server-toolkit';
import { PostsTagsDto } from './posts_tags.dto';
import { PostsTagsEntity } from './posts_tags.entity';
import { PostsTagsService } from './posts_tags.service';

@Controller('posts/tags')
export class PostsTagsController extends EntityController({
  name: 'Теги постов',
  dto: PostsTagsDto,
  entity: PostsTagsEntity,
  operations: {
    read: AccessLevel.PUBLIC,
    create: AccessLevel.SUPERUSER,
    update: AccessLevel.SUPERUSER,
    delete: AccessLevel.SUPERUSER,
  },
})<PostsTagsDto, PostsTagsEntity, PostsTagsService> {
  constructor(readonly service: PostsTagsService) {
    super();
  }
}
