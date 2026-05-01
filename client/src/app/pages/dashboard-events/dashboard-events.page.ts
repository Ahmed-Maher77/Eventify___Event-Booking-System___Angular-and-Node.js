import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage {}
