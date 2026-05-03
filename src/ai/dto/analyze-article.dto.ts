import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeArticleDto {
  @ApiPropertyOptional({
    enum: ['review', 'bugs', 'optimize', 'explain'],
    default: 'review',
    description: 'Type of analysis to perform on the article',
  })
  @IsOptional()
  @IsIn(['review', 'bugs', 'optimize', 'explain'])
  task?: 'review' | 'bugs' | 'optimize' | 'explain' = 'review';
}
