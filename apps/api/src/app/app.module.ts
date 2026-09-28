import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { CHAT_RATE_LIMITS } from '@shwetha/growing-human-contracts';
import { GrowingHumanModule } from './growing-human/growing-human.module';
import { GrowingHumanThrottlerFilter } from './growing-human/safety/throttler-exception.filter';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [
    // Nx normally starts from the workspace root, but allowing the API-local
    // file avoids silently missing configuration when the server is run there.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
    ThrottlerModule.forRoot({
      throttlers: CHAT_RATE_LIMITS.map((throttler) => ({ ...throttler })),
      errorMessage: 'I couldn’t think that one through just now. Please try again in a moment.',
    }),
    GrowingHumanModule,
    QuotesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GrowingHumanThrottlerFilter },
  ],
})
export class AppModule {}
