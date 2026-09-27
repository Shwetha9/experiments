import { NestExpressApplication } from '@nestjs/platform-express';

export const GLOBAL_PREFIX = 'api';

interface ConfigureOptions {
  /**
   * Express `trust proxy` setting. Locally only the Angular dev proxy sits in
   * front (loopback). On Vercel the edge network always sets X-Forwarded-For,
   * so the first hop is trusted to recover the real client IP for throttling.
   */
  readonly trustProxy: boolean | string | number;
}

/** Shared setup for the long-running server (main.ts) and the Vercel function. */
export function configureApp(app: NestExpressApplication, options: ConfigureOptions): void {
  app.set('trust proxy', options.trustProxy);
  app.setGlobalPrefix(GLOBAL_PREFIX);
}
