import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn, DtoCreatedColumn, DtoUpdatedColumn } from '@lms/common';
import { CommonDto } from '@lms/common';
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
