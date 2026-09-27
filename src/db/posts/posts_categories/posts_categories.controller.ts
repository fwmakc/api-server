import { Controller } from '@nestjs/common';
import { EntityController } from 'api-server-toolkit';
import { PostsCategoriesDto } from './posts_categories.dto';
import { PostsCategoriesEntity } from './posts_categories.entity';
import { PostsCategoriesService } from './posts_categories.service';

@Controller('posts/categories')
export class PostsCategoriesController extends EntityController({
  name: 'Категории постов',
  dto: PostsCategoriesDto,
  entity: PostsCategoriesEntity,
  operations: {
    read: [{ who: ['public'] }],
    create: [{ who: ['superuser'] }],
    update: [{ who: ['superuser'] }],
    delete: [{ who: ['superuser'] }],
  },
})<PostsCategoriesDto, PostsCategoriesEntity, PostsCategoriesService> {
  constructor(readonly service: PostsCategoriesService) {
    super();
  }
}
