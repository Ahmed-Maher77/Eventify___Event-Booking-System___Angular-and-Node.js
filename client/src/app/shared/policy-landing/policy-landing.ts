import { Component, Input } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-policy-landing',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './policy-landing.html',
  styleUrl: './policy-landing.scss'
})
export class PolicyLandingComponent {
  @Input({ required: true }) badgeIconClass!: string;
  @Input({ required: true }) titlePrefix!: string;
  @Input({ required: true }) titleHighlight!: string;
  @Input({ required: true }) subtitle!: string;
  @Input() lastUpdatedText = '';
  @Input() backgroundVariant: 'default' | 'flipped' = 'default';
}
