import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @ValidateIf((o) => o.articleId !== null)
  @IsUUID()
  articleId: string;

  @ApiProperty()
  @ValidateIf((o) => o.authorId !== null)
  @IsUUID()
  @IsOptional()
  authorId?: string | null;
}
