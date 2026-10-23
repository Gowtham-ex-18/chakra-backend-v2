import type { User } from '../../../common/interfaces/user.interface';

export type UserResponse = Omit<User, 'id' | 'password'>;

export function toUserResponse(
  user: Omit<User, 'password'> & { password?: string },
): UserResponse {
  const { id: _id, password: _password, ...rest } = user;
  return rest;
}
