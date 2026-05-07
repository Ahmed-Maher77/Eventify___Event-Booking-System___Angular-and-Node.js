import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, firstValueFrom, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminDashboardService,
  AdminNewsletterSubscriberListItem,
} from '../../services/admin-dashboard.service';
import { ToastService } from '../../services/toast.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import { Button } from '../../shared/button/button';
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
    Button,
  ],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss',
})
export class DashboardSubscribersPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly toastService = inject(ToastService);
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
  protected readonly isExportingCsv = signal(false);
  protected readonly pendingAction = signal<{
    type: 'status' | 'delete';
    row: AdminNewsletterSubscriberListItem;
    nextStatus?: 'active' | 'unsubscribed';
  } | null>(null);

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

  protected requestToggleSubscriberStatus(row: AdminNewsletterSubscriberListItem): void {
    const nextStatus = row.status === 'active' ? 'unsubscribed' : 'active';
    this.pendingAction.set({ type: 'status', row, nextStatus });
  }

  protected requestDeleteSubscriber(row: AdminNewsletterSubscriberListItem): void {
    this.pendingAction.set({ type: 'delete', row });
  }

  protected closePendingActionModal(): void {
    if (this.isUpdatingRowId() || this.isDeletingRowId()) {
      return;
    }
    this.pendingAction.set(null);
  }

  protected confirmPendingAction(): void {
    const pending = this.pendingAction();
    if (!pending) {
      return;
    }

    if (pending.type === 'delete') {
      this.executeDeleteSubscriber(pending.row);
      return;
    }

    this.executeToggleSubscriberStatus(pending.row, pending.nextStatus ?? 'unsubscribed');
  }

  protected async exportSubscribersCsv(scope: 'all' | 'active'): Promise<void> {
    if (this.isExportingCsv()) {
      return;
    }

    this.isExportingCsv.set(true);
    this.errorMessage.set(null);

    try {
      const status = scope === 'active' ? 'active' : undefined;
      const firstPage = await firstValueFrom(
        this.adminApi.getNewsletterSubscribers({
          page: 1,
          limit: 100,
          status,
          search: undefined,
          sort: 'createdAt',
          order: 'desc',
        }),
      );

      const totalPages = Math.max(1, firstPage.data?.pagination?.totalPages ?? 1);
      const allRows: AdminNewsletterSubscriberListItem[] = [...(firstPage.data?.subscribers ?? [])];

      for (let page = 2; page <= totalPages; page += 1) {
        const res = await firstValueFrom(
          this.adminApi.getNewsletterSubscribers({
            page,
            limit: 100,
            status,
            search: undefined,
            sort: 'createdAt',
            order: 'desc',
          }),
        );
        allRows.push(...(res.data?.subscribers ?? []));
      }

      const fileLabel = scope === 'active' ? 'active-subscribers' : 'all-subscribers';
      const csv = this.buildSubscribersCsv(allRows);
      this.downloadCsv(csv, `${fileLabel}-${new Date().toISOString().slice(0, 10)}.csv`);
      this.toastService.showSuccess(
        `Exported ${allRows.length} ${scope === 'active' ? 'active ' : ''}subscriber(s) successfully.`,
      );
    } catch (err) {
      console.error('CSV export failed', err);
      this.toastService.showError('Unable to export subscribers CSV right now.');
    } finally {
      this.isExportingCsv.set(false);
    }
  }

  protected canExport(): boolean {
    return !this.isLoading() && this.totalListItems() > 0;
  }

  private executeToggleSubscriberStatus(
    row: AdminNewsletterSubscriberListItem,
    nextStatus: 'active' | 'unsubscribed',
  ): void {
    this.isUpdatingRowId.set(row._id);
    this.errorMessage.set(null);

    this.adminApi
      .updateNewsletterSubscriberStatus(row._id, nextStatus)
      .pipe(finalize(() => this.isUpdatingRowId.set(null)))
      .subscribe({
        next: () => {
          this.pendingAction.set(null);
          this.rows.update((items) =>
            items.map((item) => (item._id === row._id ? { ...item, status: nextStatus } : item)),
          );
          this.toastService.showSuccess(
            `Subscriber ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
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

  private executeDeleteSubscriber(row: AdminNewsletterSubscriberListItem): void {
    this.isDeletingRowId.set(row._id);
    this.errorMessage.set(null);

    this.adminApi
      .deleteNewsletterSubscriber(row._id)
      .pipe(finalize(() => this.isDeletingRowId.set(null)))
      .subscribe({
        next: () => {
          this.pendingAction.set(null);
          const nextTotal = Math.max(0, this.totalListItems() - 1);
          this.totalListItems.set(nextTotal);
          this.rows.update((items) => items.filter((item) => item._id !== row._id));
          this.toastService.showSuccess('Subscriber deleted successfully.');
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

  private buildSubscribersCsv(rows: AdminNewsletterSubscriberListItem[]): string {
    const headers = ['Email', 'Status', 'Subscribed At', 'Updated At'];
    const escaped = (value: string): string => `"${value.replace(/"/g, '""')}"`;
    const formatDate = (raw?: string): string => (raw ? new Date(raw).toISOString() : '');
    const body = rows.map((row) =>
      [
        escaped(row.email ?? ''),
        escaped(row.status ?? ''),
        escaped(formatDate(row.createdAt)),
        escaped(formatDate(row.updatedAt)),
      ].join(','),
    );
    return [headers.join(','), ...body].join('\n');
  }

  private downloadCsv(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', filename);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
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
