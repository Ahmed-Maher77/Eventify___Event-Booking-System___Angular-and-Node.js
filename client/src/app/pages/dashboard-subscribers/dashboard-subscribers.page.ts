import { Component, computed, signal } from '@angular/core';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

const PAGE_SIZE = 10;

interface SubscriberRow {
  id: string;
  email: string;
  status: string;
  subscribed: string;
}

const MOCK_SUBSCRIBERS: SubscriberRow[] = Array.from({ length: 41 }, (_, i) => {
  const n = i + 1;
  return {
    id: `sub-${n}`,
    email: `subscriber${n}@example.com`,
    status: i % 5 === 0 ? 'Paused' : 'Active',
    subscribed: `Apr ${String((n % 27) + 1).padStart(2, '0')}, 2026`,
  };
});

@Component({
  selector: 'app-dashboard-subscribers-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader, AdminEntityPaginationComponent],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss',
})
export class DashboardSubscribersPage {
  protected readonly isLoading = signal(false);
  protected readonly listPage = signal(1);
  protected readonly allRows = MOCK_SUBSCRIBERS;

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
