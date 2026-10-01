import { AgeBand } from './growing-human-contracts';

export const STEAM_QUESTION_ENDPOINT = '/api/growing-human/steam/question';

export interface SteamMission {
  readonly id: string;
  readonly field: string;
  readonly title: string;
  readonly setup: string;
  readonly question: string;
  readonly choices: readonly { readonly id: string; readonly label: string }[];
  readonly correctChoice: string;
  readonly explanation: string;
  readonly tryIt: string;
  readonly nextQuestion: string;
}

/** Fixed, age-suitable challenges. Only these IDs may cross the AI boundary. */
export const STEAM_MISSIONS: readonly SteamMission[] = [
  {
    id: 'shadow', field: 'Science', title: 'The growing shadow',
    setup: 'A toy stands between a torch and a wall. The toy and wall stay still. You move the torch closer to the toy.',
    question: 'What happens to the shadow on the wall?',
    choices: [
      { id: 'bigger', label: 'It gets bigger' },
      { id: 'smaller', label: 'It gets smaller' },
      { id: 'same', label: 'It stays the same size' },
    ],
    correctChoice: 'bigger',
    explanation: 'The light spreads out from the torch. When the torch is closer, the toy blocks a wider part of that spreading light, making a bigger shadow on the wall.',
    tryIt: 'Try it with a torch, a toy and a wall. Keep the toy still while you move only the torch. What changes?',
    nextQuestion: 'What might change if you move the toy closer to the wall instead?',
  },
  {
    id: 'loop', field: 'Technology', title: 'Draw with a loop',
    setup: 'A drawing robot repeats these instructions four times: draw one straight line, then turn right by a quarter turn.',
    question: 'What shape will it draw?',
    choices: [
      { id: 'triangle', label: 'A triangle' },
      { id: 'square', label: 'A square' },
      { id: 'circle', label: 'A circle' },
    ],
    correctChoice: 'square',
    explanation: 'Four equal straight lines and four quarter turns bring the robot back to where it began. That makes a square. A loop lets us give one instruction set instead of writing it four times.',
    tryIt: 'Be the robot: take four equal steps, turning right a quarter turn after each step. Trace your path on paper first.',
    nextQuestion: 'How would you change the instructions to draw a rectangle?',
  },
  {
    id: 'bridge', field: 'Engineering', title: 'A stronger paper bridge',
    setup: 'Two strips of the same paper span the same gap. One is flat. The other is folded like an accordion.',
    question: 'Which bridge is likely to hold more small coins before bending?',
    choices: [
      { id: 'flat', label: 'The flat strip' },
      { id: 'folded', label: 'The folded strip' },
      { id: 'equal', label: 'They should be equal' },
    ],
    correctChoice: 'folded',
    explanation: 'The folds give the paper depth and help it resist bending. Engineers test shapes as well as materials to make structures stronger.',
    tryIt: 'Test two strips of the same paper over the same gap. Add coins one at a time and count how many each holds.',
    nextQuestion: 'How could you make this a fairer bridge test?',
  },
  {
    id: 'rhythm', field: 'Arts', title: 'A rhythm pattern',
    setup: 'Count eight beats aloud. Clap on beats 2, 4, 6 and 8. Your clap pattern repeats every two beats.',
    question: 'How many claps will you make in eight beats?',
    choices: [
      { id: 'two', label: 'Two' },
      { id: 'four', label: 'Four' },
      { id: 'eight', label: 'Eight' },
    ],
    correctChoice: 'four',
    explanation: 'You clap on every second beat, so there are four claps in eight beats. Music uses patterns that we can hear, feel and count.',
    tryIt: 'Tap all eight beats with one hand and clap only on the even beats. Then invent a different repeating pattern.',
    nextQuestion: 'What new rhythm could you make by clapping every third beat?',
  },
  {
    id: 'coins', field: 'Mathematics', title: 'Two coin flips',
    setup: 'Flip a coin twice. For each flip, it can land heads or tails.',
    question: 'How many different ordered results are possible?',
    choices: [
      { id: 'three', label: 'Three' },
      { id: 'four', label: 'Four' },
      { id: 'six', label: 'Six' },
    ],
    correctChoice: 'four',
    explanation: 'The possibilities are heads–heads, heads–tails, tails–heads and tails–tails. The order matters, so heads–tails and tails–heads are different results.',
    tryIt: 'Draw a branching tree for the first and second flips. Can you find all four paths?',
    nextQuestion: 'How many ordered results might three coin flips have?',
  },
];

export interface SteamQuestionRequest {
  readonly ageBand: AgeBand;
  readonly missionId: string;
  readonly choiceId: string;
}

export interface SteamQuestionReply {
  readonly question: string;
  readonly source: 'ai' | 'curated';
}
