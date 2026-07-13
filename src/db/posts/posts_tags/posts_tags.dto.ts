import { ApiProperty } from '@nestjs/swagger';
import {
  DtoColumn,
  DtoCreatedColumn,
  DtoUpdatedColumn,
} from '@src/common/common.column';
import { CommonDto } from '@src/common/common.dto';
import { PostsDto } from '../posts.dto';

export class PostsTagsDto extends CommonDto {
  @DtoCreatedColumn()
  createdAt?: Date;

  @DtoUpdatedColumn()
  updatedAt?: Date;

  @DtoColumn('Название тега')
  title?: string;

  @ApiProperty({
    required: false,
    description: 'Массив данных постов, связанных с этим тегом',
    type: () => [PostsDto],
  })
  posts?: PostsDto[];
}
