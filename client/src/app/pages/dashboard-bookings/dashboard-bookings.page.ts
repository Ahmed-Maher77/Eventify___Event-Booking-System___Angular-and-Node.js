import { Component, computed, signal } from '@angular/core';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

const PAGE_SIZE = 10;

interface BookingRow {
  id: string;
  customer: string;
  status: string;
}

const MOCK_BOOKINGS: BookingRow[] = Array.from({ length: 36 }, (_, i) => {
  const n = i + 1;
  return {
    id: `#BK-${String(1000 + n).slice(-4)}`,
    customer: `Customer ${n}`,
    status: ['Confirmed', 'Pending', 'Completed', 'Cancelled'][i % 4],
  };
});

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader, AdminEntityPaginationComponent],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss',
})
export class DashboardBookingsPage {
  protected readonly isLoading = signal(false);
  protected readonly listPage = signal(1);
  protected readonly allRows = MOCK_BOOKINGS;

  protected readonly totalListItems = computed(() => this.allRows.length);
  protected readonly listTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalListItems() / PAGE_SIZE)),
  );
  protected readonly pagedRows = computed(() => {
    const p = this.listPage();
    const start = (p - 1) * PAGE_SIZE;
    return this.allRows.slice(start, start + PAGE_SIZE);
  });

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
  }
}
