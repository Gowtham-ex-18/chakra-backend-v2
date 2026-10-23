import type { User } from './user.interface';

/** The logged-in user, attached to `req.user` by AuthGuard. */
export interface UserContext {
  user: Omit<User, 'password'>;
  /** Session id from the token; used to revoke the session on logout. */
  jti: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
