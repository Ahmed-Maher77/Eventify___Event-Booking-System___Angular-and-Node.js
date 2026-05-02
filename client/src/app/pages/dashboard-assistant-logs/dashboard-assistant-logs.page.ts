import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard-assistant-logs-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './dashboard-assistant-logs.page.html',
  styleUrl: './dashboard-assistant-logs.page.scss'
})
export class DashboardAssistantLogsPage {
  protected readonly isLoading = signal(false);
}
