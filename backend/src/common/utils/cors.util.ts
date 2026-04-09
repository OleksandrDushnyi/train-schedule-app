import { DEFAULT_CORS_ORIGINS } from '../constants/cors.constants';

type CorsCallback = (error: Error | null, allow?: boolean) => void;

export function getAllowedCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  const parsed =
    raw
      ?.split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0) ?? [];

  return parsed.length > 0 ? [...new Set(parsed)] : [...DEFAULT_CORS_ORIGINS];
}

export function createCorsOriginDelegate() {
  return (origin: string | undefined, callback: CorsCallback): void => {
    if (origin === undefined) {
      callback(null, true);
      return;
    }

    const allowedOrigins = getAllowedCorsOrigins();
    const allowed = allowedOrigins.includes(origin);
    if (allowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
  };
}
