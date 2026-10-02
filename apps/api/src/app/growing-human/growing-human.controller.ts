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
  SteamGallery,
  SteamMissionReply,
  SteamMissionRequest,
  SteamTheme,
} from '@shwetha/growing-human-contracts';
import { GrowingHumanService } from './growing-human.service';
import { KnowledgeService } from './knowledge.service';
import { ChatRequestPipe } from './pipes/chat-request.pipe';
import { SteamLabService } from './steam-lab.service';
import { SteamGalleryService } from './steam-gallery.service';

@Controller('growing-human')
export class GrowingHumanController {
  constructor(
    private readonly growingHuman: GrowingHumanService,
    private readonly knowledge: KnowledgeService,
    private readonly steamLab: SteamLabService,
    private readonly steamGallery: SteamGalleryService,
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

  @Get('steam/gallery')
  async steamImages(
    @Query('theme') theme: SteamTheme,
    @Query('page') page: string,
  ): Promise<SteamGallery> {
    return this.steamGallery.get(theme, Number(page));
  }

  @Post('steam/mission')
  @HttpCode(HttpStatus.OK)
  async steamMission(@Body() request: SteamMissionRequest): Promise<SteamMissionReply> {
    return this.steamLab.mission(request);
  }
}
