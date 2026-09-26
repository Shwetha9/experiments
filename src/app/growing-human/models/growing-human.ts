export type AgeBand = '7-10' | '11-13' | '14-16';

export type TopicLaneId = 'feelings' | 'krishna-arjuna' | 'life-skills' | 'anything';

export type ChatRole = 'child' | 'guide';

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

export interface ChatMessage {
  readonly role: ChatRole;
  readonly text: string;
}

/** Wire contract shared with the Phase 2 BFF. Limits are enforced client- and server-side. */
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
  readonly limits: {
    readonly maxMessageLength: number;
    readonly maxContextMessages: number;
  };
}
