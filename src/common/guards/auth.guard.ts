import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AuthzService } from '../../modules/auth/authz.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorException } from '../errors/custom-error.exception';
import { verifyAccessToken } from '../utils/jwt.utils';

/**
 * Global guard: every route needs a valid `Authorization: Bearer <token>`
 * header unless it is marked with @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly accessSecret: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly authzService: AuthzService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ErrorException(
        'INVALID_AUTHORISATION_TOKEN',
        'Authorization token missing',
      );
    }

    const accessToken = authHeader.slice('Bearer '.length).trim();
    const payload = verifyAccessToken(accessToken, this.accessSecret);
    const userContext = await this.authzService.buildUserContext(
      payload.sub,
      payload.jti,
    );

    if (!userContext) {
      throw new ErrorException(
        'INVALID_AUTHORISATION_TOKEN',
        'No active session',
      );
    }

    req.user = userContext;
    return true;
  }
}
