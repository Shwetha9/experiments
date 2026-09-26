import { ArchiveContent } from '../models/portfolio-content';

export const archiveContent: ArchiveContent = {
  teachings: [
    { title: 'Full-stack development', body: 'How the frontend, backend, data, APIs, and delivery pipeline fit together as one useful system.', tone: 'blush' },
    { title: 'Building for change', body: 'Practical ways to make codebases clear, resilient, and easier for the next person to work in.', tone: 'peach' },
    { title: 'Debugging with care', body: 'How to follow a problem to its source, use evidence, and turn the fix into a lesson.', tone: 'sage' },
  ],
  aphorisms: [
    'A comma can change the entire mood of a sentence.',
    'If nobody can explain the system, the system is not finished.',
    'Observability is empathy for the person on call.',
    'A good interface makes complexity feel considered, not concealed.',
  ],
  poems: [
    { title: 'Morning, unhurried', lines: ['The light does not ask', 'to be understood.', 'It simply finds the room.'] },
    { title: 'Small instruction', lines: ['Leave a little space', 'for the thing you did not', 'know you were looking for.'] },
  ],
};
