import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn, DtoCreatedColumn, DtoUpdatedColumn } from 'api-server-toolkit';
import { CommonDto } from 'api-server-toolkit';
import { PostsDto } from '../posts.dto';

export class PostsCategoriesDto extends CommonDto {
  @DtoCreatedColumn()
  createdAt?: Date;

  @DtoUpdatedColumn()
  updatedAt?: Date;

  @DtoColumn('Название категории')
  title?: string;

  @ApiProperty({
    required: false,
    description: 'Данные записей posts, входящих в категорию',
    type: () => [PostsDto],
  })
  posts?: PostsDto[];
}
