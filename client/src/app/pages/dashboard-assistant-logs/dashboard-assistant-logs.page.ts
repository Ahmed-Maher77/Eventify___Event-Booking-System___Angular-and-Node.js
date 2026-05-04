import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-assistant-logs-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './dashboard-assistant-logs.page.html',
  styleUrl: './dashboard-assistant-logs.page.scss'
})
export class DashboardAssistantLogsPage {
  protected readonly isLoading = signal(false);
}
