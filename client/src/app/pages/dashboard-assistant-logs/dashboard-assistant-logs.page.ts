import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-assistant-logs-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard-assistant-logs.page.html',
  styleUrl: './dashboard-assistant-logs.page.scss'
})
export class DashboardAssistantLogsPage {}
