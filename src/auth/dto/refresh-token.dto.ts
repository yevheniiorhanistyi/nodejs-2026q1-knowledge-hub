import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  refreshToken: string;
}
