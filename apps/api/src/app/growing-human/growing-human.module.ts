import { Module } from '@nestjs/common';
import { GrowingHumanController } from './growing-human.controller';
import { GrowingHumanService } from './growing-human.service';
import { InputSafetyService } from './safety/input-safety.service';

@Module({
  controllers: [GrowingHumanController],
  providers: [GrowingHumanService, InputSafetyService],
})
export class GrowingHumanModule {}
