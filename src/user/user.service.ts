import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';

import { ForbiddenError, NotFoundError } from '../common/errors/http-errors';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.upsert({
      where: { login: createUserDto.login },
      update: {
        password: hashedPassword,
        role: createUserDto.role,
      },
      create: {
        login: createUserDto.login,
        password: hashedPassword,
        role: createUserDto.role,
      },
    });
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany();
    return users.map((u) =>
      plainToInstance(UserResponseDto, u, { excludeExtraneousValues: true }),
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError();
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async updatePassword(
    id: string,
    dto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError();

    const passwordMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!passwordMatch) throw new ForbiddenError('Wrong password');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return plainToInstance(UserResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError();
    await this.prisma.user.delete({ where: { id } });
  }
}
