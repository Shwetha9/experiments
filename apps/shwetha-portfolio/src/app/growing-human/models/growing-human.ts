import type { AgeBand, ChatLimits, TopicLaneId } from '@shwetha/growing-human-contracts';

export type {
  AgeBand,
  ChatMessage,
  ChatReply,
  ChatReplyKind,
  ChatRequest,
  ChatRole,
  TopicLaneId,
} from '@shwetha/growing-human-contracts';

export interface AgeBandOption {
  readonly id: AgeBand;
  readonly label: string;
  readonly hint: string;
}

export interface TopicLane {
  readonly id: TopicLaneId;
  readonly title: string;
  readonly hint: string;
  readonly starters: readonly string[];
}

export interface GrowingHumanContent {
  readonly brand: string;
  readonly ageStep: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly options: readonly AgeBandOption[];
  };
  readonly laneStep: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly lanes: readonly TopicLane[];
  };
  readonly notices: {
    readonly privacy: string;
    readonly notCounsellor: string;
  };
  readonly limits: ChatLimits;
}
