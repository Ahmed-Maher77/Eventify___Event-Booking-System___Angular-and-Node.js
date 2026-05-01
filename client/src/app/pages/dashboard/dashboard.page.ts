import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {}
