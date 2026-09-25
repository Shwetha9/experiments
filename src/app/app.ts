import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

interface Card { title: string; body: string; tone: string; }
interface Poem { title: string; lines: string[]; }

@Component({ selector: 'app-root', imports: [], templateUrl: './app.html', styleUrl: './app.scss' })
export class App {
  private readonly document = inject(DOCUMENT);
  protected readonly isDark = signal(false);
  protected toggleTheme(): void {
    const isDark = !this.isDark();
    this.isDark.set(isDark);
    this.document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
  }
  protected readonly offerings: Card[] = [
    { title: 'Modern web applications', body: 'Scalable, useful web applications designed around people, clear interfaces, and durable technical decisions.', tone: 'sage' },
    { title: 'Systems that stay visible', body: 'Observability and monitoring that make it easier to understand what your product is doing in the real world.', tone: 'peach' },
    { title: 'From idea to reliable release', body: 'Full-stack delivery with thoughtful foundations, calm collaboration, and a practical eye on what comes next.', tone: 'lavender' },
  ];
  protected readonly teachings: Card[] = [
    { title: 'Full-stack development', body: 'How the frontend, backend, data, APIs, and delivery pipeline fit together as one useful system.', tone: 'blush' },
    { title: 'Building for change', body: 'Practical ways to make codebases clear, resilient, and easier for the next person to work in.', tone: 'peach' },
    { title: 'Debugging with care', body: 'How to follow a problem to its source, use evidence, and turn the fix into a lesson.', tone: 'sage' },
  ];
  protected readonly aphorisms = [
    'A comma can change the entire mood of a sentence.',
    'If nobody can explain the system, the system is not finished.',
    'Observability is empathy for the person on call.',
    'A good interface makes complexity feel considered, not concealed.',
  ];
  protected readonly poems: Poem[] = [{ title: 'Morning, unhurried', lines: ['The light does not ask', 'to be understood.', 'It simply finds the room.'] }, { title: 'Small instruction', lines: ['Leave a little space', 'for the thing you did not', 'know you were looking for.'] }];
}
