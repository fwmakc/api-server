import { Controller } from '@nestjs/common';
import { EntityController } from '@core/common';
import { PostsCategoriesDto } from './posts_categories.dto';
import { PostsCategoriesEntity } from './posts_categories.entity';
import { PostsCategoriesService } from './posts_categories.service';

@Controller('posts/categories')
export class PostsCategoriesController extends EntityController({
  name: 'Категории постов',
  dto: PostsCategoriesDto,
  entity: PostsCategoriesEntity,
  operations: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})<PostsCategoriesDto, PostsCategoriesEntity, PostsCategoriesService> {
  constructor(readonly service: PostsCategoriesService) {
    super();
  }
}
