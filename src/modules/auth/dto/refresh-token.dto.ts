import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsJWT({ message: 'refreshToken must be a valid token' })
  @IsNotEmpty({ message: 'refreshToken is required' })
  refreshToken: string;
}
