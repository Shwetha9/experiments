import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CHAT_RATE_LIMITS } from '@shwetha/growing-human-contracts';
import { GrowingHumanModule } from './growing-human/growing-human.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: CHAT_RATE_LIMITS.map((throttler) => ({ ...throttler })),
      errorMessage: 'I couldn’t think that one through just now. Please try again in a moment.',
    }),
    GrowingHumanModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
