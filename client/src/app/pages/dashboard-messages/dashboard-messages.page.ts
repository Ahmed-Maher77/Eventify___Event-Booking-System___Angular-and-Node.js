import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage {
  protected readonly isLoading = signal(false);
}
