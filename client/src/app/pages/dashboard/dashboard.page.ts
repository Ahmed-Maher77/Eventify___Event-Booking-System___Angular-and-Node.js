import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

export type InsightsPeriod = '7d' | '30d' | '90d';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  protected readonly periodOptions: InsightsPeriod[] = ['7d', '30d', '90d'];
  protected readonly selectedPeriod = signal<InsightsPeriod>('30d');

  /** Relative bar heights (0–100) for demo chart visuals */
  protected readonly bookingBarHeights = [40, 45, 44, 52, 60, 58, 65, 72, 70, 78, 85, 82, 80, 88];

  protected selectPeriod(period: InsightsPeriod): void {
    this.selectedPeriod.set(period);
  }
}
