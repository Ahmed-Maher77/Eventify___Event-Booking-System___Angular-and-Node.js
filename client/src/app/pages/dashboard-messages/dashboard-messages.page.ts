import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminContactMessageListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [
    CommonModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
  ],
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage implements OnInit {
  private readonly adminApi = inject(AdminDashboardService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly items = signal<AdminContactMessageListItem[]>([]);

  ngOnInit(): void {
    this.loadMessages();
  }

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
    this.loadMessages();
  }

  private loadMessages(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getContactMessages({ page: this.listPage(), limit: ADMIN_LIST_PAGE_SIZE })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const list = data?.messages ?? [];
          const pag = data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalMessages ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadMessages();
            return;
          }

          this.items.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          this.items.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load messages. Please try again.',
          );
        },
      });
  }
}
