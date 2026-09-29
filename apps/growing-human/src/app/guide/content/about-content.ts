import { AboutContent } from '../models/about';

/** Adult-facing explainer required before launch (spec §5.5). Approved by Shwetha 2026-09-27. */
export const aboutContent: AboutContent = {
  kicker: 'For parents, carers and teachers',
  title: 'About this experiment',
  intro:
    'Growing Humans is a small experiment by Shwetha: a calm place where young people aged 7–16 can ask big questions and practise everyday human skills. It is an AI, not a counsellor, and it is designed around safety before anything else.',
  sections: [
    {
      heading: 'What it does',
      points: [
        'Answers questions about feelings, life skills and the story of Krishna and Arjuna.',
        'Keeps answers short: one idea, one reflective question and at most one small action.',
        'Explains things differently for ages 7–10, 11–13 and 14–16.',
        'Always points young people back to the trusted adults in their life.',
      ],
    },
    {
      heading: 'What it will never do',
      points: [
        'Claim to be a person, a friend, a counsellor or a doctor.',
        'Give medical, legal or diagnostic advice.',
        'Ask for names, schools, addresses, phone numbers, passwords or photos.',
        'Encourage anyone to keep secrets from trusted adults.',
      ],
    },
    {
      heading: 'How safety works',
      points: [
        'Every message is checked before any answer is written.',
        'If a message suggests a young person may be unsafe, the AI does not answer. Instead it shows a fixed, reviewed message with Australian helplines and Triple Zero (000).',
        'Harmful requests receive a fixed, non-judgemental refusal.',
        'Every answer is checked again before it is shown. Anything unsafe is replaced with a fixed message.',
        'Before launch, a set of deliberately difficult test questions must be handled correctly: every crisis and harmful request, and at least 95% of everything else.',
      ],
    },
    {
      heading: 'Privacy',
      points: [
        'No accounts, names or birthdays. Age is chosen as a band only.',
        'Conversations are not stored or logged. Refreshing the page or choosing “Start over” clears everything.',
        'No cookies or tracking are used by Growing Humans.',
        'Requests are rate-limited to prevent misuse.',
      ],
    },
  ],
  helplinesHeading: 'If a young person needs help now',
  helplines: [
    { label: 'Emergency', detail: 'Triple Zero (000)' },
    { label: 'Kids Helpline (24/7, free)', detail: '1800 55 1800 · kidshelpline.com.au WebChat' },
    { label: 'Lifeline text', detail: '0477 13 11 14' },
  ],
  status:
    'Status: the AI guide is not switched on yet. It will only be connected after every safety check has passed.',
};
