import { ApiProperty } from '@nestjs/swagger';

export class Comment {
  @ApiProperty()
  id: string;
  @ApiProperty()
  content: string;

  @ApiProperty()
  articleId: string;

  @ApiProperty({ nullable: true })
  authorId: string | null;

  @ApiProperty({ example: 1712138925000 })
  createdAt: number;
}
