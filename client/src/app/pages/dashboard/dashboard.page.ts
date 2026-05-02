import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminRecentBookingsComponent,
  type AdminRecentBookingItemData
} from '../../shared/admin-recent-bookings/admin-recent-bookings';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

export type InsightsPeriod = '7d' | '30d' | '90d';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, RouterLink, AdminRecentBookingsComponent, Loader],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  protected readonly periodOptions: InsightsPeriod[] = ['7d', '30d', '90d'];
  protected readonly selectedPeriod = signal<InsightsPeriod>('30d');
  protected readonly isStatsLoading = signal(false);
  protected readonly isRecentBookingsLoading = signal(false);

  protected readonly recentBookings = signal<AdminRecentBookingItemData[]>([
    {
      id: 'rb-1',
      timeLabel: '2h ago',
      eventTitle: 'Summer Jazz Night',
      ticketSummary: '4 tickets'
    },
    {
      id: 'rb-2',
      timeLabel: '5h ago',
      eventTitle: 'Design Systems Workshop',
      ticketSummary: '1 ticket'
    },
    {
      id: 'rb-3',
      timeLabel: 'Yesterday',
      eventTitle: 'City Marathon 2026',
      ticketSummary: '2 tickets'
    },
    {
      id: 'rb-4',
      timeLabel: '2 days ago',
      eventTitle: 'Regional Tech Summit',
      ticketSummary: '6 tickets'
    },
    {
      id: 'rb-5',
      timeLabel: '3 days ago',
      eventTitle: 'Wine & Paint Night',
      ticketSummary: '3 tickets'
    },
    {
      id: 'rb-6',
      timeLabel: 'Last week',
      eventTitle: 'Startup Founder Meetup',
      ticketSummary: '2 tickets'
    }
  ]);

  /** Relative bar heights (0–100) for demo chart visuals */
  protected readonly bookingBarHeights = [40, 45, 44, 52, 60, 58, 65, 72, 70, 78, 85, 82, 80, 88];

  protected selectPeriod(period: InsightsPeriod): void {
    this.selectedPeriod.set(period);
  }
}
