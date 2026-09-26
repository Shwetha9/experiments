export const AGE_BANDS = ['7-10', '11-13', '14-16'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const TOPIC_LANE_IDS = ['feelings', 'krishna-arjuna', 'life-skills', 'anything'] as const;
export type TopicLaneId = (typeof TOPIC_LANE_IDS)[number];

export const CHAT_ROLES = ['child', 'guide'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export interface ChatMessage {
  readonly role: ChatRole;
  readonly text: string;
}

/** Wire contract between the portfolio and the BFF. Limits are enforced client- and server-side. */
export interface ChatRequest {
  readonly ageBand: AgeBand;
  readonly lane: TopicLaneId;
  readonly messages: readonly ChatMessage[];
}

export type ChatReplyKind = 'answer' | 'preview' | 'crisis' | 'refusal' | 'failure';

export interface ChatReply {
  readonly kind: ChatReplyKind;
  readonly text: string;
  readonly action?: string;
}

export interface ChatLimits {
  readonly maxMessageLength: number;
  readonly maxContextMessages: number;
}

export const CHAT_LIMITS: ChatLimits = {
  maxMessageLength: 500,
  maxContextMessages: 12,
};

export const CHAT_ENDPOINT = '/api/growing-human/chat';

/** Approximate reply length caps per age band, spec §5.2. */
export const AGE_BAND_WORD_CAPS: Readonly<Record<AgeBand, number>> = {
  '7-10': 60,
  '11-13': 100,
  '14-16': 150,
};

/** Rate limits signed off in spec §5.5, per IP. */
export const CHAT_RATE_LIMITS = [
  { name: 'minute', ttl: 60_000, limit: 10 },
  { name: 'hour', ttl: 3_600_000, limit: 60 },
] as const;

// Deterministic wording signed off in spec §5.3 — do not edit without re-review.

export const PREVIEW_REPLY: ChatReply = {
  kind: 'preview',
  text: 'Thank you for asking. Growing Human is still being built, so I’m not able to answer yet. The guide is only switched on after every safety check has been reviewed.',
  action: 'In the meantime, a trusted adult is a great person to explore this question with.',
};

export const REFUSAL_REPLY: ChatReply = {
  kind: 'refusal',
  text: 'That’s not something I can help with here. If it’s on your mind, a trusted adult is a good person to talk to. Is there something else you’d like to explore?',
};

export const PROVIDER_FAILURE_REPLY: ChatReply = {
  kind: 'failure',
  text: 'I couldn’t think that one through just now. Please try again in a moment.',
};

/**
 * Crisis opening line (spec §5.3): acknowledges the feeling and names a trusted adult.
 * Approved word for word by Shwetha on 2026-09-27 — do not edit without re-review.
 */
export const CRISIS_OPENING =
  'It sounds like you’re carrying something really heavy right now, and it took courage to say it. You deserve help from a real person. Please tell a trusted adult right now — a parent, carer, teacher or school counsellor.';

/** Australian helpline guidance supplied and verified by Shwetha. */
export const CRISIS_HELPLINES_AU = [
  'Need to talk to someone but don’t want to speak out loud?',
  '• Text Lifeline: Send a text message to 0477 13 11 14 to chat with someone instantly.',
  '• Use Kids Helpline Webchat: Go to kidshelpline.com.au and click on “WebChat”. You can type back and forth with a friendly counselor about anything making you feel sad, scared, or worried.',
  '• Call for Free: You can dial 1800 55 1800 on any phone. It is completely free and open 24 hours a day.',
  '🚨 If you or a friend are in immediate danger, always call Triple Zero (000) straight away.',
].join('\n');

export const CRISIS_REPLY: ChatReply = {
  kind: 'crisis',
  text: `${CRISIS_OPENING}\n\n${CRISIS_HELPLINES_AU}`,
};
