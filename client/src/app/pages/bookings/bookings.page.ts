import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './bookings.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class BookingsPage {
  protected readonly isLoading = signal(false);
}
