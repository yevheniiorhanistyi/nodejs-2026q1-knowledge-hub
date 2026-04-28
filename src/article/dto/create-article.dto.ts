import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsUUID, IsEnum, IsOptional } from 'class-validator';
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
    default: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status: ArticleStatus;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  authorId?: string | null;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  categoryId?: string | null;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];
}
