import { LandingContent } from '../models/portfolio-content';

export const landingContent: LandingContent = {
  hero: {
    eyebrow: 'Principal Engineer · Product thinker · AI systems builder',
    title: 'I build ambitious web systems—and help teams grow into them.',
    body: 'Product thinking, AI architecture, security guardrails, and engineering teams belong in the same conversation. That is how ambitious ideas become dependable systems.',
  },
  possibility: {
    eyebrow: 'What changed',
    title: 'Some ideas stopped being impossible while we were busy planning them.',
    paragraphs: [
      'The brief changed. Engineering discipline did not. AI has moved the edge of what teams can attempt. The interesting work is no longer adding a model to a product; it is deciding where intelligence belongs, what it must never be allowed to do, and how people stay in control.',
      'A product-owner past keeps the work anchored in usefulness. A frontend-engineering instinct keeps complexity legible. Principal engineering connects those decisions across architecture, delivery, observability, and the people responsible for all of it.',
    ],
  },
  practice: {
    eyebrow: 'How ambitious work moves',
    title: 'Ambition needs an operating system.',
    items: [
      { title: 'Find the real product', body: 'Clarify the human problem, the useful outcome, and the trade-offs before velocity becomes a distraction.', tone: 'sage' },
      { title: 'Design the whole system', body: 'Connect interface, platform, data, AI, delivery, and operations so the product behaves as one coherent thing.', tone: 'peach' },
      { title: 'Build the guardrails early', body: 'Treat security, privacy, evaluation, observability, and rollback paths as foundations—not release-week chores.', tone: 'lavender' },
      { title: 'Lead through uncertainty', body: 'Give teams direction, honest feedback, room to think, and accountability without turning leadership into command.', tone: 'blush' },
    ],
  },
  leadership: {
    eyebrow: 'Leadership in practice',
    title: 'When it breaks, tell the truth.',
    paragraphs: [
      'People come for direction, feedback, a clear reading of what could have gone differently—and sometimes simply for a place to vent before solving the real problem.',
      'Mistakes deserve ownership, documentation, and guardrails strong enough to stop a repeat. Empathy makes candour possible; accountability makes it useful.',
    ],
  },
  beyond: {
    eyebrow: 'Beyond the stack',
    title: 'Three ideas I return to.',
    body: 'It is an extraordinary time to build software. Ideas that once needed entire organisations—or seemed impossible—can now be explored by small, thoughtful teams. The opportunity is not to automate imagination away, but to be more ambitious together: pairing new capability with judgment, responsibility, and care for the people who will live with what we make.',
    influences: [
      {
        source: 'John Donne · Meditation XVII',
        quote: 'No man is an island, entire of itself; every man is a piece of the continent, a part of the main.',
        fullQuote: 'No man is an island, entire of itself; every man is a piece of the continent, a part of the main. If a clod be washed away by the sea, Europe is the less, as well as if a promontory were, as well as if a manor of thy friend\'s or of thine own were: any man\'s death diminishes me, because I am involved in mankind, and therefore never send to know for whom the bell tolls; it tolls for thee.',
        title: 'No one works alone.',
        reflection: 'No system, team, or decision stands alone. Leadership means staying alert to the effect one choice has on everyone who must live with it.',
        tone: 'sage',
      },
      {
        source: 'Nathaniel Hawthorne · The Custom-House',
        quote: 'Human nature will not flourish, any more than a potato, if it be planted and replanted, for too long a series of generations, in the same worn-out soil.',
        fullQuote: 'Human nature will not flourish, any more than a potato, if it be planted and replanted, for too long a series of generations, in the same worn-out soil. My children have had other birthplaces, and, so far as their fortunes may be within my control, shall strike their roots into unaccustomed earth.',
        title: 'Growth needs unfamiliar ground.',
        reflection: 'A product career became an engineering one, and engineering is now being reshaped by AI. Growth has repeatedly arrived by leaving familiar ground before certainty did.',
        tone: 'butter',
      },
      {
        source: 'Leonard Cohen · Anthem (excerpt)',
        quote: 'Forget your perfect offering. There is a crack in everything.',
        fullQuote: 'Forget your perfect offering. There is a crack in everything.',
        title: 'Imperfection lets possibility in.',
        reflection: 'Useful work is not flawless work. When something breaks, name it, repair it, document it, and build the guardrail that makes the next attempt wiser.',
        tone: 'coral',
      },
    ],
  },
  contact: {
    eyebrow: 'Start with the difficult idea',
    title: 'What became possible before your roadmap caught up?',
    body: 'Bring the ambition, the constraints, and the questions nobody has answered yet.',
    email: 'hello@shwetha.studio',
  },
};
