/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Body logging stays off: messages must never be written to logs (spec §4).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.set('trust proxy', 'loopback');
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
