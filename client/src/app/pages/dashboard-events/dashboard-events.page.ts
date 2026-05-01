import { Component } from '@angular/core';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Button],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage {}
