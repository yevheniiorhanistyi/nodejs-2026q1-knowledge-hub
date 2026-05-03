import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReindexDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  onlyPublished?: boolean = true;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  articleIds?: string[];
}

export class RagSearchDto {
  @ApiProperty({ example: 'How to use TypeScript generics?' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ default: 5, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 5;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  articleStatus?: 'draft' | 'published' | 'archived';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class RagChatDto {
  @ApiProperty({ example: 'What articles do you have about React hooks?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;
}
