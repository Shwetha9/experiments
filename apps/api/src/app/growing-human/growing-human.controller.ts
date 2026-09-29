import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ChatReply,
  ChatRequest,
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeItem,
} from '@shwetha/growing-human-contracts';
import { GrowingHumanService } from './growing-human.service';
import { KnowledgeService } from './knowledge.service';
import { ChatRequestPipe } from './pipes/chat-request.pipe';

@Controller('growing-human')
export class GrowingHumanController {
  constructor(
    private readonly growingHuman: GrowingHumanService,
    private readonly knowledge: KnowledgeService,
  ) {}

  @Get('knowledge')
  async scout(@Query('category') category: string): Promise<KnowledgeItem> {
    if (!KNOWLEDGE_CATEGORIES.some((item) => item.id === category)) {
      throw new BadRequestException('Choose a supported knowledge category.');
    }
    return this.knowledge.scout(category as KnowledgeCategory);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body(ChatRequestPipe) request: ChatRequest): Promise<ChatReply> {
    return this.growingHuman.reply(request);
  }
}
