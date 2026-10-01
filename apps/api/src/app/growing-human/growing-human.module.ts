import { Module } from '@nestjs/common';
import { GrowingHumanController } from './growing-human.controller';
import { GrowingHumanService } from './growing-human.service';
import { GuidePromptService } from './prompt/guide-prompt.service';
import { OpenRouterClient } from './provider/openrouter.client';
import { InputSafetyService } from './safety/input-safety.service';
import { KnowledgeService } from './knowledge.service';
import { SteamLabService } from './steam-lab.service';

@Module({
  controllers: [GrowingHumanController],
  providers: [GrowingHumanService, KnowledgeService, SteamLabService, InputSafetyService, GuidePromptService, OpenRouterClient],
})
export class GrowingHumanModule {}
