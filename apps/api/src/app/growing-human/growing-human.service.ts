import { Injectable } from '@nestjs/common';
import {
  AGE_BAND_WORD_CAPS,
  ChatReply,
  ChatRequest,
  CRISIS_REPLY,
  PREVIEW_REPLY,
  PROVIDER_FAILURE_REPLY,
  REFUSAL_REPLY,
} from '@shwetha/growing-human-contracts';
import { GuidePrompt, GuidePromptService } from './prompt/guide-prompt.service';
import { OpenRouterClient } from './provider/openrouter.client';
import { InputSafetyService } from './safety/input-safety.service';
import { containsRemovedPersonalData, redactPersonalData } from './safety/personal-data';
import { InputSafetyCategory } from './safety/safety-decision';

/**
 * BFF entry point. The provider is disabled unless an operator deliberately sets
 * GROWING_HUMAN_ENABLE_GUIDE=true alongside every required server-side setting.
 * Messages and provider responses are only kept in memory for this request.
 */
@Injectable()
export class GrowingHumanService {
  constructor(
    private readonly inputSafety: InputSafetyService,
    private readonly prompts: GuidePromptService,
    private readonly provider: OpenRouterClient,
  ) {}

  async reply(request: ChatRequest): Promise<ChatReply> {
    const latestMessage = request.messages[request.messages.length - 1];
    if (!latestMessage) return PROVIDER_FAILURE_REPLY;

    const localDecision = this.inputSafety.decide(latestMessage.text);
    if (localDecision === 'crisis') return CRISIS_REPLY;
    if (localDecision === 'disallowed') return REFUSAL_REPLY;
    if (!this.provider.guideEnabled) return PREVIEW_REPLY;

    // Classify only redacted data. An unclear, low-confidence, failed, or timed-out
    // decision never proceeds to the guide model.
    const classifierText = redactPersonalData(latestMessage.text).text;
    const classified = await this.provider.classifyInput(classifierText);
    if (!classified || !classified.confident) return PROVIDER_FAILURE_REPLY;
    if (classified.category === 'crisis') return CRISIS_REPLY;
    if (classified.category === 'disallowed') return REFUSAL_REPLY;

    const risk = stricterNormalRisk(localDecision, classified.category);
    const prompt = this.prompts.compose(request, risk);
    const first = await this.generateAndCheck(prompt, request, risk);
    if (first.reply) return first.reply;
    if (!first.candidate || first.blocked) return PROVIDER_FAILURE_REPLY;

    // The output gate permits exactly one rewrite. A second rejection always falls
    // back to the reviewed fixed wording.
    const rewrite = await this.generateAndCheck(
      this.prompts.rewritePrompt(first.candidate, request, risk),
      request,
      risk,
    );
    return rewrite.reply ?? PROVIDER_FAILURE_REPLY;
  }

  private async generateAndCheck(
    prompt: GuidePrompt,
    request: ChatRequest,
    risk: InputSafetyCategory,
  ): Promise<CheckedGeneration> {
    const candidate = await this.provider.completeGuide(prompt.system, prompt.user);
    if (!candidate) return { candidate: null, blocked: true };

    const draft = parseGuideReply(candidate);
    if (!draft) return { candidate, blocked: false };
    const structuralIssue = validateDraft(draft, request, risk, prompt.removedPersonalData);
    if (structuralIssue) return { candidate, blocked: false };

    const outputDecision = await this.provider.classifyOutput(formatReply(draft));
    if (!outputDecision || !outputDecision.confident) return { candidate, blocked: true };
    if (outputDecision.decision === 'block') return { candidate, blocked: true };
    if (outputDecision.decision === 'rewrite') return { candidate, blocked: false };
    return { reply: toReply(draft), candidate, blocked: false };
  }
}

interface GuideDraft {
  readonly answer: string;
  readonly question: string;
  readonly action?: string;
}

interface CheckedGeneration {
  readonly reply?: ChatReply;
  readonly candidate: string | null;
  readonly blocked: boolean;
}

const stricterNormalRisk = (
  local: InputSafetyCategory,
  remote: InputSafetyCategory,
): InputSafetyCategory =>
  local === 'sensitive' || remote === 'sensitive' ? 'sensitive' : 'ordinary';

const parseGuideReply = (candidate: string): GuideDraft | null => {
  const normalized = candidate
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    const parsed: unknown = JSON.parse(normalized);
    if (
      !isRecord(parsed) ||
      typeof parsed['answer'] !== 'string' ||
      typeof parsed['question'] !== 'string'
    ) {
      return null;
    }
    const answer = parsed['answer'].trim();
    const question = parsed['question'].trim();
    const action = typeof parsed['action'] === 'string' ? parsed['action'].trim() : undefined;
    if (!answer || !question) return null;
    return { answer, question, ...(action ? { action } : {}) };
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

const validateDraft = (
  draft: GuideDraft,
  request: ChatRequest,
  risk: InputSafetyCategory,
  removedPersonalData: readonly string[],
): string | null => {
  const fullText = formatReply(draft);
  if (countWords(fullText) > AGE_BAND_WORD_CAPS[request.ageBand]) return 'word-cap';
  if (!draft.question.endsWith('?') || (fullText.match(/\?/g) ?? []).length !== 1)
    return 'question-count';
  if (containsRemovedPersonalData(fullText, removedPersonalData)) return 'personal-data';
  if (
    /\b(system prompt|ignore (all )?previous instructions|as your (friend|counsellor)|i am (a )?(human|counsellor|doctor))\b/i.test(
      fullText,
    )
  ) {
    return 'unsafe-claim';
  }
  if (risk === 'sensitive' && !/trusted adult/i.test(fullText)) return 'trusted-adult';
  return null;
};

const formatReply = (draft: GuideDraft): string =>
  [draft.answer, draft.question, draft.action]
    .filter((value): value is string => Boolean(value))
    .join('\n\n');

const toReply = (draft: GuideDraft): ChatReply => ({
  kind: 'answer',
  text: [draft.answer, draft.question].join('\n\n'),
  ...(draft.action ? { action: draft.action } : {}),
});
