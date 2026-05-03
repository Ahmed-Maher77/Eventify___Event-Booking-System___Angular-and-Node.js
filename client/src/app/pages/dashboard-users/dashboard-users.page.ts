import { Component, computed, signal } from '@angular/core';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

const PAGE_SIZE = 10;

interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  joined: string;
}

const MOCK_MEMBERS: MemberRow[] = Array.from({ length: 33 }, (_, i) => {
  const n = i + 1;
  return {
    id: `user-${n}`,
    name: `Member ${n}`,
    email: `member${n}@example.com`,
    role: i % 7 === 0 ? 'Admin' : 'Member',
    joined: `May ${String((n % 28) + 1).padStart(2, '0')}, 2026`,
  };
});

@Component({
  selector: 'app-dashboard-users-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader, AdminEntityPaginationComponent],
  templateUrl: './dashboard-users.page.html',
  styleUrl: './dashboard-users.page.scss',
})
export class DashboardUsersPage {
  protected readonly isLoading = signal(false);
  protected readonly listPage = signal(1);
  protected readonly allRows = MOCK_MEMBERS;

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
