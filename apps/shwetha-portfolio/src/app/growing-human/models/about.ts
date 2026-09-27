export interface AboutSection {
  readonly heading: string;
  readonly points: readonly string[];
}

export interface Helpline {
  readonly label: string;
  readonly detail: string;
}

export interface AboutContent {
  readonly kicker: string;
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly AboutSection[];
  readonly helplinesHeading: string;
  readonly helplines: readonly Helpline[];
  readonly status: string;
}
