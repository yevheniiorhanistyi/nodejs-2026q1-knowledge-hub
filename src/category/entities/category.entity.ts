import { ApiProperty } from '@nestjs/swagger';
export class Category {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}
