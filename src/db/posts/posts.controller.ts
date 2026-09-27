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
    read: [
      { who: ['public'], filter: { isPublished: true } },
      { who: ['editor'] },
      { who: ['admin'] },
      { who: ['authenticated'], scope: { owner: 'account.id' } },
    ],
    create: [{ who: ['authenticated'], scope: { owner: 'account.id' } }],
    update: [
      { who: ['editor'] },
      { who: ['admin'] },
      { who: ['authenticated'], scope: { owner: 'account.id' } },
    ],
    delete: [
      { who: ['admin'] },
      { who: ['authenticated'], scope: { owner: 'account.id' } },
    ],
  },
  fields: {
    secretNotes: {
      response: [{ who: ['editor'] }, { who: ['admin'] }],
      request: [{ who: ['editor'] }, { who: ['admin'] }],
    },
  },
  relations: ['tags', 'category', 'account'],
})<PostsDto, PostsEntity, PostsService> {
  constructor(readonly service: PostsService) {
    super();
  }
}
