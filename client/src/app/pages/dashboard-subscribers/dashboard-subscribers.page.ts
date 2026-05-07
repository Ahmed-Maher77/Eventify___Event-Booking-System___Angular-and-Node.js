import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminDashboardService,
  AdminNewsletterSubscriberListItem,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-subscribers-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
    CustomNativeSelectComponent,
  ],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss',
})
export class DashboardSubscribersPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;
  protected readonly audienceStatusOptions: CustomNativeSelectOption[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'unsubscribed', label: 'Unsubscribed' },
  ];
  protected readonly audienceFilterForm = this.fb.nonNullable.group({
    search: [''],
    status: ['all' as 'all' | 'active' | 'unsubscribed'],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isUpdatingRowId = signal<string | null>(null);
  protected readonly isDeletingRowId = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminNewsletterSubscriberListItem[]>([]);
  protected readonly audienceFiltersExpanded = signal(false);

  ngOnInit(): void {
    this.audienceFilterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.listPage.set(1);
        this.loadSubscribers();
      });

    this.loadSubscribers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onListPageChange(page: number): void {
    const total = this.listTotalPages();
    const next = Math.max(1, Math.min(page, total));
    if (next === this.listPage()) {
      return;
    }
    this.listPage.set(next);
    this.loadSubscribers();
  }

  protected clearFilters(): void {
    this.audienceFilterForm.reset(
      {
        search: '',
        status: 'all',
      },
      { emitEvent: false },
    );
    this.listPage.set(1);
    this.loadSubscribers();
  }

  protected toggleAudienceFilters(): void {
    this.audienceFiltersExpanded.update((open) => !open);
  }

  protected hasActiveAudienceFilters(): boolean {
    const filters = this.audienceFilterForm.getRawValue();
    return filters.status !== 'all' || !!filters.search.trim();
  }

  protected toggleSubscriberStatus(row: AdminNewsletterSubscriberListItem): void {
    const nextStatus = row.status === 'active' ? 'unsubscribed' : 'active';
    this.isUpdatingRowId.set(row._id);
    this.errorMessage.set(null);

    this.adminApi
      .updateNewsletterSubscriberStatus(row._id, nextStatus)
      .pipe(finalize(() => this.isUpdatingRowId.set(null)))
      .subscribe({
        next: () => {
          this.rows.update((items) =>
            items.map((item) => (item._id === row._id ? { ...item, status: nextStatus } : item)),
          );
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update subscriber status. Please try again.',
          );
        },
      });
  }

  protected deleteSubscriber(row: AdminNewsletterSubscriberListItem): void {
    if (!window.confirm(`Delete subscriber ${row.email}? This action cannot be undone.`)) {
      return;
    }

    this.isDeletingRowId.set(row._id);
    this.errorMessage.set(null);

    this.adminApi
      .deleteNewsletterSubscriber(row._id)
      .pipe(finalize(() => this.isDeletingRowId.set(null)))
      .subscribe({
        next: () => {
          const nextTotal = Math.max(0, this.totalListItems() - 1);
          this.totalListItems.set(nextTotal);
          this.rows.update((items) => items.filter((item) => item._id !== row._id));
          this.loadSubscribers();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to delete subscriber. Please try again.',
          );
        },
      });
  }

  private loadSubscribers(): void {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const filters = this.audienceFilterForm.getRawValue();
    const status = filters.status === 'all' ? undefined : filters.status;
    const search = filters.search.trim();

    this.adminApi
      .getNewsletterSubscribers({
        page: this.listPage(),
        limit: ADMIN_LIST_PAGE_SIZE,
        status,
        search: search || undefined,
        sort: 'createdAt',
        order: 'desc',
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (requestId !== this.latestRequestId) {
            return;
          }

          const data = res.data;
          const list = data?.subscribers ?? [];
          const pag = data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const total = pag?.totalSubscribers ?? 0;
          let page = this.listPage();

          if (page > totalPages && totalPages >= 1) {
            page = totalPages;
            this.listPage.set(page);
            this.loadSubscribers();
            return;
          }

          this.rows.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err: HttpErrorResponse) => {
          if (requestId !== this.latestRequestId) {
            return;
          }

          this.rows.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load subscribers. Please try again.',
          );
        },
      });
  }
}
