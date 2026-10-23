import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import type { UserContext } from '../../common/interfaces/auth.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { LoginRequestDto } from './dto/login.dto';
import { toUserResponse } from '../user/dto/user-response.dto';
import type { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.dto';

import { AuthzService } from './authz.service';

@Controller('auth')
export class AuthzController {
  constructor(private readonly authzService: AuthzService) { }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() body: LoginRequestDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    return this.authzService.login(body, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenRequestDto): Promise<LoginResponseDto> {
    return this.authzService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserContext): Promise<{ message: string }> {
    await this.authzService.logout(user);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  me(@CurrentUser() user: UserContext) {
    return toUserResponse(user.user);
  }
}
