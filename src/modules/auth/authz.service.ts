import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { ErrorException } from '../../common/errors/custom-error.exception';
import type { UserContext } from '../../common/interfaces/auth.interface';
import type { User } from '../../common/interfaces/user.interface';
import {
  getTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/jwt.utils';
import { SessionRepository } from '../../database/repository/session.repository';
import { UserRepository } from '../../database/repository/user.repository';
import { comparePassword } from '../../database/schema/user.schema';
import { toUserResponse } from '../user/dto/user-response.dto';
import type { LoginRequestDto } from './dto/login.dto';
import type { LoginResponseDto } from './dto/login-response.dto';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthzService {
  private readonly logger = new Logger(AuthzService.name);

  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  async login(
    request: LoginRequestDto,
    meta: RequestMeta,
  ): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(request.email);
    const passwordOk = await comparePassword(request.password, user?.password);

    if (!user || !passwordOk) {
      this.logger.warn(`login failed: ${request.email}`);
      throw new ErrorException('INVALID_USER');
    }

    const jti = randomUUID();
    const tokens = this.issueTokens(user, jti);

    await this.sessionRepository.create({
      jti,
      userId: user.id,
      expiresAt: tokens.refreshTokenExpiresAt,
      ipAddress: meta.ipAddress?.slice(0, 45),
      userAgent: meta.userAgent?.slice(0, 512),
    });

    this.logger.log(`login: ${user.email}`);
    return this.toLoginResponse(user, tokens);
  }

  /** Exchanges a refresh token for a new token pair. The old refresh token stops working. */
  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    const payload = verifyRefreshToken(refreshToken, this.refreshSecret);

    const user = await this.sessionRepository.findActiveUser(
      payload.jti,
      payload.sub,
    );
    if (!user) {
      throw new ErrorException(
        'INVALID_AUTHORISATION_TOKEN',
        'Session expired or revoked',
      );
    }

    const newJti = randomUUID();
    const tokens = this.issueTokens(user, newJti);

    const rotated = await this.sessionRepository.rotate(
      payload.jti,
      newJti,
      tokens.refreshTokenExpiresAt,
    );
    if (!rotated) {
      // Another request refreshed this session first
      throw new ErrorException(
        'INVALID_AUTHORISATION_TOKEN',
        'Session expired or revoked',
      );
    }

    return this.toLoginResponse(user, tokens);
  }

  async logout(userContext: UserContext): Promise<void> {
    await this.sessionRepository.revoke(userContext.jti);
    this.logger.log(`logout: ${userContext.user.email}`);
  }

  /** Used by AuthGuard on every request: null if the session is revoked or expired. */
  async buildUserContext(
    publicUserId: string,
    jti: string,
  ): Promise<UserContext | null> {
    const user = await this.sessionRepository.findActiveUser(jti, publicUserId);
    if (!user) return null;

    const { password: _password, ...safeUser } = user;
    return { user: safeUser, jti };
  }

  private issueTokens(user: User, jti: string) {
    // `sub` is the public userId, so tokens never expose the internal id
    const accessToken = signAccessToken(
      { sub: user.userId, jti, role: user.role },
      this.accessSecret,
      this.accessExpiresIn,
    );
    const refreshToken = signRefreshToken(
      { sub: user.userId, jti },
      this.refreshSecret,
      this.refreshExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: getTokenExpiry(accessToken),
      refreshTokenExpiresAt: getTokenExpiry(refreshToken),
    };
  }

  private toLoginResponse(
    user: User,
    tokens: ReturnType<AuthzService['issueTokens']>,
  ): LoginResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      user: toUserResponse(user),
    };
  }
}
