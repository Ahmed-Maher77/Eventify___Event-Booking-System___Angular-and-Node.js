import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminRecentBookingItemComponent,
  type AdminRecentBookingItemData
} from '../admin-recent-booking-item/admin-recent-booking-item';

export type { AdminRecentBookingItemData };

const MAX_VISIBLE = 6;
const LEFT_CAP = 3;

@Component({
  selector: 'app-admin-recent-bookings',
  standalone: true,
  imports: [RouterLink, AdminRecentBookingItemComponent],
  templateUrl: './admin-recent-bookings.html',
  styleUrl: './admin-recent-bookings.scss'
})
export class AdminRecentBookingsComponent {
  readonly items = input.required<AdminRecentBookingItemData[]>();
  readonly viewAllLink = input('/dashboard/bookings');

  /** Up to 6 items: left column filled first (max 3), remainder on the right (max 3). */
  protected readonly leftColumn = computed(() => {
    const capped = this.items().slice(0, MAX_VISIBLE);
    const takeLeft = Math.min(LEFT_CAP, capped.length);
    return capped.slice(0, takeLeft);
  });

  protected readonly rightColumn = computed(() => {
    const capped = this.items().slice(0, MAX_VISIBLE);
    return capped.slice(LEFT_CAP);
  });
}
