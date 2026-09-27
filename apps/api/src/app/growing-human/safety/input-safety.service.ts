import { Injectable } from '@nestjs/common';
import { InputSafetyCategory } from './safety-decision';

/**
 * The local, fail-safe first pass for incoming messages. It is deliberately
 * conservative: a positive match never reaches a model. A provider-backed Jev
 * decision will be added as a second pass before the guide is enabled.
 */
export type { InputSafetyCategory } from './safety-decision';

const crisisPatterns: readonly RegExp[] = [
  /\b(kill myself|end (my|their) life|want to die|do(n'?t| not) want to be alive|better off without me|kms)\b/i,
  /\b(self[ -]?harm|cut(ting)? myself|hurt myself|goodbye letters|not wake up)\b/i,
  /\b(pain stop forever|sleep and not wake up)\b/i,
  /\b(adult touch\w* me.*secret|someone (is )?hitting me|hitting me at home)\b/i,
  /\b(meet (them|someone) alone tonight)\b/i,
];

const disallowedPatterns: readonly RegExp[] = [
  /\b(make|build) (a )?weapon\b/i,
  /\bbuy vapes? without (an )?id\b/i,
  /\b(sexy|porn|nude)\b/i,
  /\b(joke|fun).*(makes? fun of|hate)\b/i,
  /\bhack(ing)?\b/i,
  /\b(ignore (your )?rules|show me your instructions|repeat everything above|system prompt|you are now dan)\b/i,
  /\b(get .* hurt|start a fight and win|drunk fast)\b/i,
];

const sensitivePatterns: readonly RegExp[] = [
  /\b(died|grief|crying|bull(y|ied|ying)|fat|anxiety|nervous|divorc|worry|worried|sleep)\b/i,
  /\b(hate how i look|parents? fight|group chat.*ignoring)\b/i,
];

const matches = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

@Injectable()
export class InputSafetyService {
  decide(text: string): InputSafetyCategory {
    const normalized = text.normalize('NFKC').replace(/\s+/g, ' ').trim();

    // Crisis always wins, including when the message also asks for disallowed details.
    if (matches(normalized, crisisPatterns)) return 'crisis';
    if (matches(normalized, disallowedPatterns)) return 'disallowed';
    if (matches(normalized, sensitivePatterns)) return 'sensitive';
    return 'ordinary';
  }
}
