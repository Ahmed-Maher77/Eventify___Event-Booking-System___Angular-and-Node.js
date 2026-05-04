import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-highlighted-page-heading',
  standalone: true,
  templateUrl: './highlighted-page-heading.html',
  styleUrl: './highlighted-page-heading.scss'
})
export class HighlightedPageHeadingComponent {
  @Input({ required: true }) titlePrefix!: string;
  @Input({ required: true }) titleHighlight!: string;
  @Input() titleSuffix = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() headingLevel: 'h1' | 'h2' = 'h1';
  @Input() containerClass = '';
  @Input() titleClass = '';
  @Input() subtitleClass = '';
  @Input() eyebrowClass = '';

  protected get composedContainerClass(): string {
    return ['highlighted-page-heading', this.containerClass].filter(Boolean).join(' ');
  }

  protected get composedTitleClass(): string {
    return [this.titleClass, 'eventify-title-shape'].filter(Boolean).join(' ');
  }
}
