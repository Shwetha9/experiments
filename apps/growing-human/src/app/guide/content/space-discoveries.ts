export interface SpaceDiscovery {
  readonly id: string;
  readonly place: string;
  readonly symbol: string;
  readonly title: string;
  readonly fact: string;
  readonly question: string;
  readonly choices: readonly string[];
  readonly answer: number;
  readonly explanation: string;
  readonly source: string;
}

// Reviewed, fixed content keeps this activity usable while the AI guide is gated.
export const spaceDiscoveries: readonly SpaceDiscovery[] = [
  {
    id: 'moon',
    place: 'The Moon',
    symbol: '☾',
    title: 'The Moon has a familiar face.',
    fact: 'From Earth, we see nearly the same side of the Moon. It spins once in about the same time it takes to travel around Earth.',
    question: 'Why do we usually see the same side of the Moon?',
    choices: ['It never spins', 'It spins as it travels around Earth', 'Earth blocks its other side'],
    answer: 1,
    explanation: 'The Moon does spin! One turn takes about as long as one trip around Earth.',
    source: 'https://science.nasa.gov/solar-system/moon/five-things-to-know-about-the-moon/',
  },
  {
    id: 'mars',
    place: 'Mars',
    symbol: '✦',
    title: 'Mars has a giant volcano.',
    fact: 'Olympus Mons on Mars is the largest known volcano in our solar system. Its base covers an area about as large as Arizona.',
    question: 'What is Olympus Mons?',
    choices: ['A volcano on Mars', 'A moon of Saturn', 'A crater on Earth'],
    answer: 0,
    explanation: 'Olympus Mons is a huge volcano on Mars.',
    source: 'https://science.nasa.gov/mars/facts/',
  },
  {
    id: 'saturn',
    place: 'Saturn',
    symbol: '◎',
    title: 'Saturn’s rings are made of pieces.',
    fact: 'Saturn’s rings are made of countless chunks of ice and rock. Some pieces are tiny like dust; others are much bigger.',
    question: 'What makes up Saturn’s rings?',
    choices: ['One solid hoop', 'Only clouds', 'Pieces of ice and rock'],
    answer: 2,
    explanation: 'The rings are many separate pieces of ice and rock orbiting Saturn.',
    source: 'https://science.nasa.gov/saturn/facts/',
  },
  {
    id: 'sunlight',
    place: 'Sunlight',
    symbol: '☼',
    title: 'Sunlight takes a little trip.',
    fact: 'Light from the Sun takes about eight minutes to reach Earth. The sunshine you see began its journey a few minutes ago.',
    question: 'About how long does sunlight take to reach Earth?',
    choices: ['Eight seconds', 'Eight minutes', 'Eight days'],
    answer: 1,
    explanation: 'About eight minutes. Please remember: never look directly at the Sun.',
    source: 'https://science.nasa.gov/earth/facts/',
  },
];
