import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './bookings.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class BookingsPage {}
