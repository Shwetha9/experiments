import { Component } from '@angular/core';

interface Card { title: string; body: string; tone: string; }
interface Poem { title: string; lines: string[]; }

@Component({ selector: 'app-root', imports: [], templateUrl: './app.html', styleUrl: './app.scss' })
export class App {
  protected readonly offerings: Card[] = [
    { title: 'Words with a pulse', body: 'Thoughtful writing, editing, and language that remembers there is a person on the other side.', tone: 'peach' },
    { title: 'Gentle creative direction', body: 'A clear eye for the mood, rhythm, and small details that make an idea feel like itself.', tone: 'sage' },
    { title: 'A place for your ideas', body: 'Design thinking that gives half-formed things room to become useful and beautiful.', tone: 'lavender' },
  ];
  protected readonly teachings: Card[] = [
    { title: 'How to notice', body: 'The useful magic of pauses, margins, and looking twice.', tone: 'blush' },
    { title: 'How to edit kindly', body: 'Not every good idea needs more. Some need a little more air.', tone: 'peach' },
    { title: 'How to trust a feeling', body: 'A practical way to follow taste without mistaking it for certainty.', tone: 'sage' },
  ];
  protected readonly aphorisms = ['A comma can change the entire mood of a sentence.', 'Some things need editing, some things need more sunlight.', 'A good idea often arrives wearing an unconvincing hat.', 'Pay attention to what makes you look twice.'];
  protected readonly poems: Poem[] = [{ title: 'Morning, unhurried', lines: ['The light does not ask', 'to be understood.', 'It simply finds the room.'] }, { title: 'Small instruction', lines: ['Leave a little space', 'for the thing you did not', 'know you were looking for.'] }];
  protected readonly photographs: Card[] = [{ title: 'Window study', body: 'Rain holding the afternoon still.', tone: 'lavender' }, { title: 'Garden notes', body: 'Green, with one brave peach.', tone: 'sage' }, { title: 'After the train', body: 'A blur of gold, almost remembered.', tone: 'peach' }];
}
