import { Module } from '@nestjs/common';
import { GrowingHumanController } from './growing-human.controller';
import { GrowingHumanService } from './growing-human.service';
import { GuidePromptService } from './prompt/guide-prompt.service';
import { OpenRouterClient } from './provider/openrouter.client';
import { InputSafetyService } from './safety/input-safety.service';

@Module({
  controllers: [GrowingHumanController],
  providers: [GrowingHumanService, InputSafetyService, GuidePromptService, OpenRouterClient],
})
export class GrowingHumanModule {}
