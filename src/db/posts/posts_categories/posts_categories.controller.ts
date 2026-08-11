import { Controller } from '@nestjs/common';
import { AccessLevel, EntityController } from 'api-server-toolkit';
import { PostsCategoriesDto } from './posts_categories.dto';
import { PostsCategoriesEntity } from './posts_categories.entity';
import { PostsCategoriesService } from './posts_categories.service';

@Controller('posts/categories')
export class PostsCategoriesController extends EntityController({
  name: 'Категории постов',
  dto: PostsCategoriesDto,
  entity: PostsCategoriesEntity,
  operations: {
    read: AccessLevel.PUBLIC,
    create: AccessLevel.SUPERUSER,
    update: AccessLevel.SUPERUSER,
    delete: AccessLevel.SUPERUSER,
  },
})<PostsCategoriesDto, PostsCategoriesEntity, PostsCategoriesService> {
  constructor(readonly service: PostsCategoriesService) {
    super();
  }
}
