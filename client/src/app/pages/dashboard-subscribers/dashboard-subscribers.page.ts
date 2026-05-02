import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-subscribers-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss',
})
export class DashboardSubscribersPage {
  protected readonly isLoading = signal(false);
}
