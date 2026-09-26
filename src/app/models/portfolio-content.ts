export interface PracticeItem {
  readonly title: string;
  readonly body: string;
  readonly tone: 'sage' | 'peach' | 'lavender' | 'blush';
}

export interface Poem {
  readonly title: string;
  readonly lines: readonly string[];
}

export interface LandingContent {
  readonly hero: { readonly eyebrow: string; readonly title: string; readonly body: string };
  readonly possibility: {
    readonly eyebrow: string;
    readonly title: string;
    readonly paragraphs: readonly string[];
  };
  readonly practice: {
    readonly eyebrow: string;
    readonly title: string;
    readonly items: readonly PracticeItem[];
  };
  readonly leadership: {
    readonly eyebrow: string;
    readonly title: string;
    readonly paragraphs: readonly string[];
  };
  readonly beyond: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly notes: readonly string[];
  };
  readonly contact: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly email: string;
  };
}

export interface ArchiveContent {
  readonly teachings: readonly PracticeItem[];
  readonly aphorisms: readonly string[];
  readonly poems: readonly Poem[];
}
