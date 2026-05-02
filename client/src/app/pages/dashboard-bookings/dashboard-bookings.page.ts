import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss'
})
export class DashboardBookingsPage {
  protected readonly isLoading = signal(false);
}
