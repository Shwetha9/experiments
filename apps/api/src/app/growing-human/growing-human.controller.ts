import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatReply, ChatRequest } from '@shwetha/growing-human-contracts';
import { GrowingHumanService } from './growing-human.service';
import { ChatRequestPipe } from './pipes/chat-request.pipe';

@Controller('growing-human')
export class GrowingHumanController {
  constructor(private readonly growingHuman: GrowingHumanService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body(ChatRequestPipe) request: ChatRequest): ChatReply {
    return this.growingHuman.reply(request);
  }
}
