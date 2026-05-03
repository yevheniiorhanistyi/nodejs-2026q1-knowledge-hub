import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';

import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../common/errors/http-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getSaltRounds(): number {
    const salt = Number(this.config.get('CRYPT_SALT'));
    return Number.isInteger(salt) && salt > 0 ? salt : 10;
  }

  async signup(dto: SignupDto): Promise<{ id: string; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });
    if (existing) {
      throw new ValidationError('Login is already taken');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.getSaltRounds(),
    );

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        role: 'viewer',
      },
    });

    return { id: user.id, message: 'User created successfully' };
  }

  async login(dto: LoginDto): Promise<TokensResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      throw new ForbiddenError('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new ForbiddenError('Invalid credentials');
    }

    return this.generateTokens(user.id, user.login, user.role);
  }

  async refresh(dto: RefreshTokenDto): Promise<TokensResponseDto> {
    if (!dto?.refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new ForbiddenError('Invalid credentials');
      }

      return this.generateTokens(user.id, user.login, user.role);
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
        throw err;
      }
      throw new ForbiddenError('Refresh token is invalid or expired');
    }
  }

  private generateTokens(
    userId: string,
    login: string,
    role: string,
  ): TokensResponseDto {
    const payload = { userId, login, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: (this.config.get('JWT_ACCESS_TTL') ?? '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get('JWT_REFRESH_TTL') ?? '7d') as StringValue,
    });

    return { accessToken, refreshToken };
  }
}
