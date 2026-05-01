import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-subscribers-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss'
})
export class DashboardSubscribersPage {}
