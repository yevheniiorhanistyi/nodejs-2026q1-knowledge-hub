import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({
    example: 'Explain what is TypeScript in simple terms',
    description: 'Free-form prompt to send to the AI model',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    example: 'session-abc-123',
    description: 'Optional session ID for conversation context',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
