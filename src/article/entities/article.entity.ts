import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus } from '../article.types';

export class Article {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ArticleStatus })
  status: ArticleStatus;

  @ApiProperty({ nullable: true, format: 'uuid' })
  authorId: string | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  categoryId: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ example: 1712138925000 })
  createdAt: number;

  @ApiProperty({ example: 1712138925000 })
  updatedAt: number;
}
