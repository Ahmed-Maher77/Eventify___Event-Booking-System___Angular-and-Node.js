import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminBookingListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
  ],
  templateUrl: './dashboard-bookings.page.html',
  styleUrl: './dashboard-bookings.page.scss',
})
export class DashboardBookingsPage implements OnInit {
  private readonly adminApi = inject(AdminDashboardService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminBookingListItem[]>([]);

  ngOnInit(): void {
    this.loadBookings();
  }

  protected onListPageChange(page: number): void {
    this.listPage.set(page);
    this.loadBookings();
  }

  protected bookingCustomerLabel(b: AdminBookingListItem): string {
    const u = b.userId;
    if (u && typeof u === 'object' && 'name' in u && (u as { name?: string }).name) {
      return (u as { name: string }).name;
    }
    return '—';
  }

  private loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getBookings({ page: this.listPage(), limit: ADMIN_LIST_PAGE_SIZE })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const list = data?.bookings ?? [];
          const pag = data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalBookings ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadBookings();
            return;
          }

          this.rows.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          this.rows.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load bookings. Please try again.',
          );
        },
      });
  }
}
