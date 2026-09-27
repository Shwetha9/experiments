/**
 * Vercel serverless entry point. Built by Nx into dist/apps/api/vercel.js and
 * re-exported from /api/index.js at the repository root.
 *
 * The Nest app is created once per warm function instance and reused across
 * invocations; request bodies are never logged (spec §4).
 */
import { IncomingMessage, ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';

type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

let listener: Promise<RequestListener> | null = null;

async function createListener(): Promise<RequestListener> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
    logger: ['error', 'warn', 'log'],
  });
  configureApp(app, { trustProxy: 1 });
  await app.init();
  return app.getHttpAdapter().getInstance() as RequestListener;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  listener ??= createListener().catch((error: unknown) => {
    // Allow the next invocation to retry a failed cold start.
    listener = null;
    throw error;
  });
  const app = await listener;
  app(req, res);
}
