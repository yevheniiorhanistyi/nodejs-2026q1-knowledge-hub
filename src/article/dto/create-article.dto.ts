import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsUUID,
  IsEnum,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ArticleStatus } from '@prisma/client';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({
    enum: ArticleStatus,
    default: ArticleStatus.draft,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status: ArticleStatus;

  @ApiProperty()
  @ValidateIf((o) => o.authorId !== null)
  @IsUUID()
  @IsOptional()
  authorId?: string | null;

  @ApiProperty()
  @ValidateIf((o) => o.categoryId !== null)
  @IsUUID()
  @IsOptional()
  categoryId?: string | null;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];
}
