import {
  AGE_BANDS,
  AgeBand,
  CHAT_LIMITS,
  CHAT_ROLES,
  ChatMessage,
  ChatRequest,
  ChatRole,
  TOPIC_LANE_IDS,
  TopicLaneId,
} from '@shwetha/growing-human-contracts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAgeBand = (value: unknown): value is AgeBand => AGE_BANDS.some((band) => band === value);

const isLane = (value: unknown): value is TopicLaneId =>
  TOPIC_LANE_IDS.some((lane) => lane === value);

const isRole = (value: unknown): value is ChatRole => CHAT_ROLES.some((role) => role === value);

const toMessage = (value: unknown): ChatMessage | null => {
  if (!isRecord(value)) return null;
  const { role, text } = value;
  if (!isRole(role) || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > CHAT_LIMITS.maxMessageLength) return null;
  return { role, text: trimmed };
};

/** Returns a sanitised request, or `null` when the body breaks the wire contract. */
export const parseChatRequest = (body: unknown): ChatRequest | null => {
  if (!isRecord(body)) return null;
  const { ageBand, lane, messages } = body;
  if (!isAgeBand(ageBand) || !isLane(lane) || !Array.isArray(messages)) return null;
  if (messages.length === 0 || messages.length > CHAT_LIMITS.maxContextMessages) return null;

  const parsed: ChatMessage[] = [];
  for (const raw of messages) {
    const message = toMessage(raw);
    if (!message) return null;
    parsed.push(message);
  }

  if (parsed[parsed.length - 1].role !== 'child') return null;
  return { ageBand, lane, messages: parsed };
};
