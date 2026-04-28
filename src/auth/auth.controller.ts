import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

import { Public } from '../common/decorators/public.decorator';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.',
  })
  signup(
    @Body() signupDto: SignupDto,
  ): Promise<{ id: string; message: string }> {
    return this.authService.signup(signupDto);
  }

  @Public()
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login or password.',
  })
  @ApiResponse({
    status: 403,
    description: 'No user with the provided credentials.',
  })
  @HttpCode(200)
  login(@Body() loginDto: LoginDto): Promise<TokensResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiResponse({
    status: 200,
    description: 'The token has been successfully refreshed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid or missing refresh token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Refresh token is invalid or expired.',
  })
  @HttpCode(200)
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokensResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }
}
