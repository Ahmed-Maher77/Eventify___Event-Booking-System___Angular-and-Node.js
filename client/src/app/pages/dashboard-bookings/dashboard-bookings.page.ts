import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss'
})
export class DashboardBookingsPage {}
