import { Quote } from '../models/quote';

export const localQuotes: readonly Quote[] = [
  {
    id: 'local-john-donne-island',
    text: 'No man is an island, entire of itself; every man is a piece of the continent, a part of the main.',
    author: 'John Donne',
    work: 'Meditation XVII',
    categories: ['life', 'wisdom', 'leadership'],
    source: 'personal',
  },
  {
    id: 'local-nathaniel-hawthorne-ground',
    text: 'Human nature will not flourish, any more than a potato, if it be planted and replanted, for too long a series of generations, in the same worn-out soil.',
    author: 'Nathaniel Hawthorne',
    work: 'The Custom-House',
    categories: ['life', 'wisdom', 'courage'],
    source: 'personal',
  },
  {
    id: 'local-leonard-cohen-crack',
    text: 'Forget your perfect offering. There is a crack in everything.',
    author: 'Leonard Cohen',
    work: 'Anthem',
    categories: ['art', 'writing', 'courage'],
    source: 'personal',
  },
];

export const localAuthors = [...new Set(localQuotes.map((quote) => quote.author))];
