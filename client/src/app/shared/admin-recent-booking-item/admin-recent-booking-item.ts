import { Component, input } from '@angular/core';

export interface AdminRecentBookingItemData {
  id: string;
  timeLabel: string;
  eventTitle: string;
  ticketSummary: string;
}

@Component({
  selector: 'li[app-admin-recent-booking-item]',
  standalone: true,
  templateUrl: './admin-recent-booking-item.html',
  styleUrl: './admin-recent-booking-item.scss',
  host: {
    class: 'admin-recent-booking-item'
  }
})
export class AdminRecentBookingItemComponent {
  readonly entry = input.required<AdminRecentBookingItemData>();
  /** When true, show a short fading segment below the dot (end of column). */
  readonly isLastInColumn = input(false);
}
