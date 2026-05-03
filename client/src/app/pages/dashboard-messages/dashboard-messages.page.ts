import { Component, computed, signal } from '@angular/core';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

const PAGE_SIZE = 10;

interface MessageItem {
  id: string;
  from: string;
  subject: string;
  meta: string;
}

const MOCK_MESSAGES: MessageItem[] = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1;
  return {
    id: `msg-${n}`,
    from: `Sender ${n}`,
    subject:
      i % 3 === 0
        ? 'Question about group booking discount'
        : i % 3 === 1
          ? 'Invoice request for conference tickets'
          : 'Venue accessibility information',
    meta:
      i % 4 === 0
        ? 'Received 2 hours ago'
        : i % 4 === 1
          ? 'Received yesterday'
          : i % 4 === 2
            ? 'Received 3 days ago'
            : 'Received last week',
  };
});

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader, AdminEntityPaginationComponent],
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage {
  protected readonly isLoading = signal(false);
  protected readonly listPage = signal(1);
  protected readonly allItems = MOCK_MESSAGES;

  protected readonly totalListItems = computed(() => this.allItems.length);
  protected readonly listTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalListItems() / PAGE_SIZE)),
  );
  protected readonly pagedItems = computed(() => {
    const p = this.listPage();
    const start = (p - 1) * PAGE_SIZE;
    return this.allItems.slice(start, start + PAGE_SIZE);
  });

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
  }
}
