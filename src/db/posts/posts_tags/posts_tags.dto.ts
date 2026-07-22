import { ApiProperty } from '@nestjs/swagger';
import { DtoColumn, DtoCreatedColumn, DtoUpdatedColumn } from 'api-server-toolkit';
import { CommonDto } from 'api-server-toolkit';
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
