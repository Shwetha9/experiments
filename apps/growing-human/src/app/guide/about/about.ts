import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { aboutContent } from '../content/about-content';

@Component({
  selector: 'app-growing-human-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class GrowingHumanAboutPage {
  protected readonly content = aboutContent;
}
