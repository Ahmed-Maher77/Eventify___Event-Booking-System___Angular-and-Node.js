import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminAssistantActivityListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { MarkdownPipe } from '../../utils/markdown.pipe';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-assistant-logs-page',
  standalone: true,
  imports: [
    CommonModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
    MarkdownPipe,
  ],
  templateUrl: './dashboard-assistant-logs.page.html',
  styleUrl: './dashboard-assistant-logs.page.scss',
})
export class DashboardAssistantLogsPage implements OnInit {
  private readonly adminApi = inject(AdminDashboardService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminAssistantActivityListItem[]>([]);

  ngOnInit(): void {
    this.loadActivities();
  }

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
    this.loadActivities();
  }

  private loadActivities(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getAssistantActivities({
        page: this.listPage(),
        limit: ADMIN_LIST_PAGE_SIZE,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const list = res.data?.activities ?? [];
          const total = res.total ?? 0;
          const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

          this.rows.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err) => {
          console.error('Failed to load assistant activity:', err);
          this.rows.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          this.errorMessage.set('Failed to load activity logs. Please try again.');
        },
      });
  }
}

