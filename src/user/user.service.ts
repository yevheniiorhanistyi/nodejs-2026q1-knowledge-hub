import { randomUUID } from 'node:crypto';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';

import { UserRole } from './user.types';
import { User } from './entities/user.entity';
import { CommentService } from '../comment/comment.service';
import { ArticleService } from '../article/article.service';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  create(createUserDto: CreateUserDto): UserResponseDto {
    const newUser: User = {
      id: randomUUID(),
      ...createUserDto,
      role: createUserDto.role || UserRole.VIEWER,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.users.push(newUser);

    return plainToInstance(UserResponseDto, newUser, {
      excludeExtraneousValues: true,
    });
  }

  findAll(): UserResponseDto[] {
    return this.users.map((user) =>
      plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    );
  }

  findOne(id: string): UserResponseDto {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException();

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): UserResponseDto | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException();

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Wrong password');
    }

    user.password = updatePasswordDto.newPassword;
    user.updatedAt = Date.now();

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  remove(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException();
    this.users.splice(index, 1);

    this.articleService.nullifyAuthor(id);
    this.commentService.removeByAuthorId(id);
  }
}
