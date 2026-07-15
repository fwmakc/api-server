import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn, DtoCreatedColumn, DtoUpdatedColumn } from '@lms/common';
import { CommonDto } from '@lms/common';
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
