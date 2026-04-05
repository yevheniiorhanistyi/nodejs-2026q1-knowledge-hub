import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetCommentsQueryDto {
  @ApiProperty()
  @IsUUID()
  articleId: string;
}
