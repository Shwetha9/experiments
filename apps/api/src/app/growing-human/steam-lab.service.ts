import { BadRequestException, Injectable } from '@nestjs/common';
import { AGE_BANDS, STEAM_MISSIONS, SteamQuestionReply, SteamQuestionRequest } from '@shwetha/growing-human-contracts';
import { OpenRouterClient } from './provider/openrouter.client';

@Injectable()
export class SteamLabService {
  constructor(private readonly provider: OpenRouterClient) {}

  async question(input: SteamQuestionRequest): Promise<SteamQuestionReply> {
    const mission = STEAM_MISSIONS.find((item) => item.id === input?.missionId);
    const choice = mission?.choices.find((item) => item.id === input?.choiceId);
    if (!mission || !choice || !AGE_BANDS.some((age) => age === input?.ageBand)) {
      throw new BadRequestException('Choose a supported mission, prediction and age group.');
    }

    const fallback: SteamQuestionReply = { question: mission.nextQuestion, source: 'curated' };
    if (!this.provider.steamAiEnabled) return fallback;

    // No child-authored text, names, or browsing history crosses this boundary.
    const system = [
      'You write a single optional follow-up question for a child doing a STEAM prediction activity.',
      'Ask one short, concrete, open-ended question that helps them test, compare, or change one variable.',
      'Do not introduce new factual claims. Do not ask for personal details, location, photos, uploads, or contact.',
      'Do not praise or judge the child. Return plain text only, with exactly one question mark.',
    ].join(' ');
    const user = JSON.stringify({
      ageBand: input.ageBand,
      field: mission.field,
      setup: mission.setup,
      question: mission.question,
      prediction: choice.label,
      explanation: mission.explanation,
    });

    const candidate = await this.provider.completeSteamQuestion(system, user);
    if (!validQuestion(candidate)) return fallback;
    const decision = await this.provider.classifySteamQuestion(candidate!);
    if (decision?.decision !== 'release' || !decision.confident) return fallback;
    return { question: candidate!.trim(), source: 'ai' };
  }
}

const validQuestion = (value: string | null): boolean => {
  if (!value) return false;
  const text = value.trim();
  return text.length >= 12 && text.length <= 150 &&
    !/[\r\n<>]/.test(text) &&
    (text.match(/\?/g)?.length ?? 0) === 1 &&
    text.endsWith('?');
};
