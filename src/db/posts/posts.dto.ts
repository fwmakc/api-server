import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn } from 'api-server-toolkit';
import { CommonDto } from 'api-server-toolkit';
import { PostsCategoriesDto } from './posts_categories/posts_categories.dto';
import { PostsTagsDto } from './posts_tags/posts_tags.dto';

export class PostsDto extends CommonDto {
  @DtoColumn('Дата и время создания записи, назначается автоматически')
  createdAt?: Date;

  @DtoColumn(
    'Дата и время последнего обновления записи, назначается автоматически',
  )
  updatedAt?: Date;

  @DtoColumn('Заголовок')
  title: string;

  @DtoColumn('Содержимое')
  content: string;

  @DtoColumn('Дата публикации, начиная с которой запись будет видна')
  publishedAt: Date;

  @DtoColumn('Флаг публикации, отключение может сделать запись недоступной')
  isPublished: boolean;

  @DtoColumn('Приватные заметки автора (доступ: read — owner, write — owner)')
  secretNotes: string;

  @DtoColumn('Счётчик просмотров (доступ: write — closed, обновляется только системой)')
  viewCount: number;

  @ApiProperty({
    required: false,
    description: 'Данные категории, связанной с данной записью',
    type: () => PostsCategoriesDto,
  })
  category?: PostsCategoriesDto;

  @ApiProperty({
    required: false,
    description: 'Данные тегов, связанных с данной записью',
    type: () => [PostsTagsDto],
  })
  tags?: PostsTagsDto[];
}
