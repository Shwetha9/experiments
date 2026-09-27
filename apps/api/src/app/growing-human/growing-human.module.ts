import { Module } from '@nestjs/common';
import { GrowingHumanController } from './growing-human.controller';
import { GrowingHumanService } from './growing-human.service';

@Module({
  controllers: [GrowingHumanController],
  providers: [GrowingHumanService],
})
export class GrowingHumanModule {}
