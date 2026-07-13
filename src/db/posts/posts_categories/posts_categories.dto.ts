import { ApiProperty } from '@nestjs/swagger';
import {
  DtoColumn,
  DtoCreatedColumn,
  DtoUpdatedColumn,
} from '@src/common/common.column';
import { CommonDto } from '@src/common/common.dto';
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
