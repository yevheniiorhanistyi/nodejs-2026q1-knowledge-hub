import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateArticleDto {
  @ApiProperty({
    example: 'Ukrainian',
    description: 'Target language for translation (e.g. "Ukrainian", "French")',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional({
    example: 'English',
    description:
      'Source language (optional, Gemini will auto-detect if omitted)',
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
