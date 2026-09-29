export const KNOWLEDGE_CATEGORIES = [
  { id: 'surprise', label: 'Surprise me', apiCategory: null },
  { id: 'science', label: 'Science & nature', apiCategory: 'sciencenature' },
  { id: 'places', label: 'Places', apiCategory: 'geography' },
  { id: 'history', label: 'History', apiCategory: 'historyholidays' },
  { id: 'arts', label: 'Arts & stories', apiCategory: 'artliterature' },
  { id: 'numbers', label: 'Numbers', apiCategory: 'mathematics' },
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number]['id'];

export interface KnowledgeItem {
  readonly category: KnowledgeCategory;
  readonly kind: 'fact' | 'question';
  readonly text: string;
  readonly answer?: string;
  readonly source: 'api-ninjas' | 'reviewed';
}

export const KNOWLEDGE_ENDPOINT = '/api/growing-human/knowledge';

/** Reviewed fallback material, available when the provider or premium filters are unavailable. */
export const REVIEWED_KNOWLEDGE: Readonly<Record<KnowledgeCategory, KnowledgeItem>> = {
  surprise: {
    category: 'surprise',
    kind: 'fact',
    text: 'An octopus has three hearts.',
    source: 'reviewed',
  },
  science: {
    category: 'science',
    kind: 'question',
    text: 'What is the closest star to Earth?',
    answer: 'The Sun.',
    source: 'reviewed',
  },
  places: {
    category: 'places',
    kind: 'question',
    text: 'Which ocean is the largest on Earth?',
    answer: 'The Pacific Ocean.',
    source: 'reviewed',
  },
  history: {
    category: 'history',
    kind: 'question',
    text: 'Who built the pyramids at Giza?',
    answer: 'Ancient Egyptians.',
    source: 'reviewed',
  },
  arts: {
    category: 'arts',
    kind: 'question',
    text: 'How many strings does a standard violin have?',
    answer: 'Four.',
    source: 'reviewed',
  },
  numbers: {
    category: 'numbers',
    kind: 'question',
    text: 'What is the only even prime number?',
    answer: 'Two.',
    source: 'reviewed',
  },
};

export const REVIEWED_KNOWLEDGE_DECKS: Readonly<Record<KnowledgeCategory, readonly KnowledgeItem[]>> = {
  surprise: [
    REVIEWED_KNOWLEDGE.surprise,
    { category: 'surprise', kind: 'fact', text: 'Honeybees use dances to tell other bees where to find food.', source: 'reviewed' },
    { category: 'surprise', kind: 'fact', text: 'A group of flamingos is called a flamboyance.', source: 'reviewed' },
  ],
  science: [
    REVIEWED_KNOWLEDGE.science,
    { category: 'science', kind: 'question', text: 'What do plants take in from the air to make food?', answer: 'Carbon dioxide.', source: 'reviewed' },
    { category: 'science', kind: 'question', text: 'What force keeps us on the ground?', answer: 'Gravity.', source: 'reviewed' },
  ],
  places: [
    REVIEWED_KNOWLEDGE.places,
    { category: 'places', kind: 'question', text: 'Which continent contains the South Pole?', answer: 'Antarctica.', source: 'reviewed' },
    { category: 'places', kind: 'question', text: 'Which country is Tokyo in?', answer: 'Japan.', source: 'reviewed' },
  ],
  history: [
    REVIEWED_KNOWLEDGE.history,
    { category: 'history', kind: 'question', text: 'What did Roman aqueducts carry into cities?', answer: 'Water.', source: 'reviewed' },
    { category: 'history', kind: 'question', text: 'What invention helped make books much faster?', answer: 'The printing press.', source: 'reviewed' },
  ],
  arts: [
    REVIEWED_KNOWLEDGE.arts,
    { category: 'arts', kind: 'question', text: 'What do you call a person who writes a play?', answer: 'A playwright.', source: 'reviewed' },
    { category: 'arts', kind: 'question', text: 'What instrument has black and white keys?', answer: 'A piano.', source: 'reviewed' },
  ],
  numbers: [
    REVIEWED_KNOWLEDGE.numbers,
    { category: 'numbers', kind: 'question', text: 'How many sides does a hexagon have?', answer: 'Six.', source: 'reviewed' },
    { category: 'numbers', kind: 'question', text: 'What is twelve times twelve?', answer: '144.', source: 'reviewed' },
  ],
};
