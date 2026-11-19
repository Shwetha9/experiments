import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@studio/theme';
import { resumeContent } from '@studio/editorial-content';

@Component({
  selector: 'app-resume',
  imports: [RouterLink],
  templateUrl: './resume.html',
  styleUrl: './resume.scss',
})
export class ResumePage {
  private readonly theme = inject(ThemeService);
  protected readonly content = resumeContent;
  protected readonly isDark = this.theme.isDark;

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
