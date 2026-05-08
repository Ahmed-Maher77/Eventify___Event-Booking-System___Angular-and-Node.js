import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminContactMessageListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-messages-page',
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
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;

  protected readonly statusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
  ];
  protected readonly sortOptions: CustomNativeSelectOption[] = [
    { value: 'createdAt', label: 'Date' },
    { value: 'fullName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'subject', label: 'Subject' },
    { value: 'status', label: 'Status' },
  ];
  protected readonly orderOptions: CustomNativeSelectOption[] = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];
  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    sort: ['createdAt' as 'createdAt' | 'fullName' | 'email' | 'subject' | 'status'],
    order: ['desc' as 'asc' | 'desc'],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly items = signal<AdminContactMessageListItem[]>([]);
  protected readonly filtersExpanded = signal(false);
  protected readonly activeStatusTab = signal<'all' | 'new' | 'reviewed'>('all');
  protected readonly actionInProgressId = signal<string | null>(null);
  protected readonly isBulkActionLoading = signal(false);
  protected readonly expandedMessageIds = signal<Set<string>>(new Set());
  protected readonly pendingAction = signal<{
    type: 'delete' | 'status';
    item: AdminContactMessageListItem;
    nextStatus?: 'new' | 'reviewed';
  } | null>(null);

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.listPage.set(1);
        this.loadMessages();
      });

    this.loadMessages();
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
    this.loadMessages();
  }

  protected toggleFilters(): void {
    this.filtersExpanded.update((open) => !open);
  }

  protected clearFilters(): void {
    this.filterForm.reset(
      {
        search: '',
        status: '',
        sort: 'createdAt',
        order: 'desc',
      },
      { emitEvent: false },
    );
    this.listPage.set(1);
    this.loadMessages();
  }

  protected setStatusTab(status: 'all' | 'new' | 'reviewed'): void {
    this.activeStatusTab.set(status);
    this.filterForm.patchValue(
      {
        status: status === 'all' ? '' : status,
      },
      { emitEvent: true },
    );
  }

  protected isActiveStatusTab(status: 'all' | 'new' | 'reviewed'): boolean {
    return this.activeStatusTab() === status;
  }

  protected markMessageAsReviewed(item: AdminContactMessageListItem): void {
    this.requestStatusAction(item, 'reviewed');
  }

  protected markMessageAsNew(item: AdminContactMessageListItem): void {
    this.requestStatusAction(item, 'new');
  }

  protected requestDeleteMessage(item: AdminContactMessageListItem): void {
    this.pendingAction.set({ type: 'delete', item });
  }

  protected closePendingActionModal(): void {
    if (this.isBulkActionLoading()) {
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
      this.executeDeleteMessage(pending.item);
      return;
    }

    this.updateSingleMessageStatus(pending.item, pending.nextStatus ?? 'reviewed');
  }

  private executeDeleteMessage(item: AdminContactMessageListItem): void {
    this.actionInProgressId.set(item._id);
    this.errorMessage.set(null);

    this.adminApi
      .deleteContactMessage(item._id)
      .pipe(finalize(() => this.actionInProgressId.set(null)))
      .subscribe({
        next: () => {
          this.pendingAction.set(null);
          this.expandedMessageIds.update((ids) => {
            const next = new Set(ids);
            next.delete(item._id);
            return next;
          });

          // If this was the last visible item on a non-first page, move back one page.
          if (this.items().length === 1 && this.listPage() > 1) {
            this.listPage.set(this.listPage() - 1);
          }

          this.items.update((rows) => rows.filter((row) => row._id !== item._id));
          this.totalListItems.set(Math.max(0, this.totalListItems() - 1));
          this.toastService.showSuccess('Message deleted successfully.');
          this.loadMessages();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to delete this message. Please try again.',
          );
        },
      });
  }

  private requestStatusAction(item: AdminContactMessageListItem, status: 'new' | 'reviewed'): void {
    if (item.status === status) {
      return;
    }
    this.pendingAction.set({ type: 'status', item, nextStatus: status });
  }

  protected markAllAsReviewed(): void {
    this.bulkUpdateVisibleMessagesStatus('reviewed');
  }

  protected markAllAsNew(): void {
    this.bulkUpdateVisibleMessagesStatus('new');
  }

  protected hasAnyNew(): boolean {
    return this.items().some((item) => item.status === 'new');
  }

  protected hasAnyReviewed(): boolean {
    return this.items().some((item) => item.status === 'reviewed');
  }

  protected toggleMessageExpanded(id: string): void {
    this.expandedMessageIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected isMessageExpanded(id: string): boolean {
    return this.expandedMessageIds().has(id);
  }

  protected shouldShowMessageToggle(item: AdminContactMessageListItem): boolean {
    return (item.message ?? '').trim().length > 80;
  }

  protected hasActiveFilters(): boolean {
    const f = this.filterForm.getRawValue();
    return !!f.search.trim() || !!f.status.trim() || f.sort !== 'createdAt' || f.order !== 'desc';
  }

  protected isMessageActionDisabled(item: AdminContactMessageListItem): boolean {
    return this.actionInProgressId() === item._id || this.isBulkActionLoading();
  }

  private loadMessages(): void {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const f = this.filterForm.getRawValue();
    const search = f.search.trim();
    const safePage = Math.max(1, this.listPage());
    if (safePage !== this.listPage()) {
      this.listPage.set(safePage);
    }

    this.adminApi
      .getContactMessages({
        page: safePage,
        limit: ADMIN_LIST_PAGE_SIZE,
        status: f.status || undefined,
        search: search || undefined,
        sort: f.sort,
        order: f.order,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (requestId !== this.latestRequestId) {
            return;
          }

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
          if (requestId !== this.latestRequestId) {
            return;
          }

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

  private updateSingleMessageStatus(
    item: AdminContactMessageListItem,
    status: 'new' | 'reviewed',
  ): void {
    if (item.status === status) {
      return;
    }

    this.actionInProgressId.set(item._id);
    this.errorMessage.set(null);

    this.adminApi
      .updateContactMessageStatus(item._id, status)
      .pipe(finalize(() => this.actionInProgressId.set(null)))
      .subscribe({
        next: () => {
          this.pendingAction.set(null);
          this.items.update((rows) =>
            rows.map((row) => (row._id === item._id ? { ...row, status } : row)),
          );
          this.toastService.showSuccess(
            status === 'reviewed' ? 'Message marked as read.' : 'Message marked as unread.',
          );
          this.loadMessages();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update message status. Please try again.',
          );
        },
      });
  }

  private bulkUpdateVisibleMessagesStatus(status: 'new' | 'reviewed'): void {
    const targets = this.items().filter((item) => item.status !== status);
    if (!targets.length) {
      return;
    }

    this.isBulkActionLoading.set(true);
    this.errorMessage.set(null);

    const requests = targets.map((item) =>
      this.adminApi.updateContactMessageStatus(item._id, status).pipe(
        map(() => ({ ok: true as const })),
      ),
    );

    forkJoin(requests)
      .pipe(
        switchMap(() => {
          this.items.update((rows) => rows.map((row) => ({ ...row, status })));
          return of(null);
        }),
        finalize(() => this.isBulkActionLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            status === 'reviewed'
              ? 'All visible messages marked as read.'
              : 'All visible messages marked as unread.',
          );
          this.loadMessages();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update all selected messages. Please try again.',
          );
        },
      });
  }
}
