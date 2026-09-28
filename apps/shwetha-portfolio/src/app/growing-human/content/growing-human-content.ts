import { CHAT_LIMITS } from '@shwetha/growing-human-contracts';
import { GrowingHumanContent } from '../models/growing-human';

export const growingHumanContent: GrowingHumanContent = {
  brand: 'Growing Human',
  ageStep: {
    introTitle: 'A quiet place for big questions.',
    introBody:
      'Bring your curiosity about feelings, friendships, choices, or whatever is on your mind. We can take it one small thought at a time.',
    kicker: 'First, help me speak your language',
    title: 'Which age group feels right?',
    body: 'No birthday, name or account. This only changes how answers are explained.',
    options: [
      { id: '7-10', label: 'Ages 7–10', hint: 'Short answers and clear examples' },
      { id: '11-13', label: 'Ages 11–13', hint: 'More reflection and practical ideas' },
      { id: '14-16', label: 'Ages 14–16', hint: 'Nuance, independence and real-life trade-offs' },
    ],
  },
  laneStep: {
    kicker: 'A thoughtful place for curious minds',
    title: 'Big questions belong here.',
    body: 'Choose a place to begin, or ask anything under the sun.',
    lanes: [
      {
        id: 'feelings',
        title: 'Understand my feelings',
        hint: 'Name what is happening inside.',
        starters: [
          'Why do I feel angry so quickly?',
          'How do I know if I’m sad or just tired?',
          'What can I do when I feel left out?',
          'How can I calm down before I say something mean?',
          'Why do my feelings change so fast?',
        ],
      },
      {
        id: 'krishna-arjuna',
        title: 'Krishna & Arjuna',
        hint: 'Explore a timeless conversation.',
        starters: [
          'Why was Arjuna afraid before the battle?',
          'What does it mean to do your duty?',
          'What can Krishna and Arjuna teach me about making a hard choice?',
          'How can I be brave when I feel nervous?',
          'What does it mean to do the right thing when it is hard?',
        ],
      },
      {
        id: 'life-skills',
        title: 'Life skills',
        hint: 'Money, feedback and pressure.',
        starters: [
          'How do I take criticism without feeling bad?',
          'How can I save money for something I want?',
          'How do I apologise when I have made a mistake?',
          'What can I do when homework feels too big?',
          'How can I disagree without starting a fight?',
        ],
      },
      {
        id: 'anything',
        title: 'Ask anything',
        hint: 'Start with your own question.',
        starters: [
          'Why do people have different opinions?',
          'How can I be a good friend?',
          'What makes a question a good question?',
          'How do I try something new when I feel nervous?',
        ],
      },
    ],
  },
  notices: {
    privacy:
      'Please don’t share your full name, school, address, phone number, passwords or photos.',
    notCounsellor:
      'Growing Human is an AI, not a counsellor. If you feel unsafe, talk to a trusted adult now.',
  },
  limits: CHAT_LIMITS,
};
