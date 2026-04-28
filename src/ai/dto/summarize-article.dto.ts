import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SummarizeArticleDto {
  @ApiPropertyOptional({
    enum: ['short', 'medium', 'detailed'],
    default: 'medium',
    description: 'Length of the generated summary',
  })
  @IsOptional()
  @IsIn(['short', 'medium', 'detailed'])
  maxLength?: 'short' | 'medium' | 'detailed' = 'medium';
}
