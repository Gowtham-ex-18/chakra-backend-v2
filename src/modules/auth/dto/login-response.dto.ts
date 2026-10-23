import type { UserResponse } from '../../user/dto/user-response.dto';

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** When the access token expires (ISO date). Call /auth/refresh before then. */
  accessTokenExpiresAt: string;
  user: UserResponse;
}
