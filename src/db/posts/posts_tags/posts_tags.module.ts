import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from '../posts.module';
import { PostsTagsController } from './posts_tags.controller';
import { PostsTagsEntity } from './posts_tags.entity';
import { PostsTagsService } from './posts_tags.service';

@Module({
  controllers: [PostsTagsController],
  imports: [
    TypeOrmModule.forFeature([PostsTagsEntity]),
    forwardRef(() => PostsModule),
  ],
  providers: [PostsTagsService],
  exports: [PostsTagsService],
})
export class PostsTagsModule {}
