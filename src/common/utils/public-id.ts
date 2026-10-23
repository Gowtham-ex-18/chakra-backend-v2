import { customAlphabet } from 'nanoid';

export const PUBLIC_ID_LENGTH = 16;

/**
 * Random, URL-safe ID that is safe to expose outside the app (e.g. "k3Xp9ZqL2mN7vB4t").
 * 62^16 possible values, so collisions are practically impossible.
 */
export const generatePublicId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  PUBLIC_ID_LENGTH,
);
