import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss'
})
export class DashboardBookingsPage {
  protected readonly isLoading = signal(false);
}
