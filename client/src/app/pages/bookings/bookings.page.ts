import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './bookings.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class BookingsPage {
  protected readonly isLoading = signal(false);
}
