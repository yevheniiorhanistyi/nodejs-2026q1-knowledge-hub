import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  login: string;

  @ApiProperty()
  @Expose()
  role: Role;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : value))
  createdAt: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : value))
  updatedAt: number;

  @Exclude()
  password: string;
}
