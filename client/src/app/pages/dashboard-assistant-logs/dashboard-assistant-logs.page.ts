import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import {
  ADMIN_LIST_PAGE_SIZE,
  AdminAssistantActivityListItem,
  AdminDashboardService,
} from '../../services/admin-dashboard.service';
import { AdminEntityPaginationComponent } from '../../shared/admin-entity-pagination/admin-entity-pagination.component';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { MarkdownPipe } from '../../utils/markdown.pipe';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard-assistant-logs-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HighlightedPageHeadingComponent,
    SectionLoader,
    AdminEntityPaginationComponent,
    CustomNativeSelectComponent,
    MarkdownPipe,
  ],
  templateUrl: './dashboard-assistant-logs.page.html',
  styleUrl: './dashboard-assistant-logs.page.scss',
})
export class DashboardAssistantLogsPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private latestRequestId = 0;

  protected readonly statusOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'rate-limited', label: 'Rate-limited' },
  ];
  protected readonly latencyOptions: CustomNativeSelectOption[] = [
    { value: '', label: 'All latency' },
    { value: 'slow', label: 'Slow (>2s)' },
    { value: 'verySlow', label: 'Very slow (>5s)' },
  ];
  protected readonly sortOptions: CustomNativeSelectOption[] = [
    { value: 'createdAt', label: 'Date' },
    { value: 'responseMs', label: 'Latency' },
    { value: 'relevantEventsCount', label: 'RAG count' },
    { value: 'status', label: 'Status' },
    { value: 'model', label: 'Model' },
  ];
  protected readonly orderOptions: CustomNativeSelectOption[] = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];
  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: [''],
    model: [''],
    latencyBucket: [''],
    sort: ['createdAt' as 'createdAt' | 'responseMs' | 'relevantEventsCount' | 'status' | 'model'],
    order: ['desc' as 'asc' | 'desc'],
  });

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listPage = signal(1);
  protected readonly listTotalPages = signal(1);
  protected readonly totalListItems = signal(0);
  protected readonly rows = signal<AdminAssistantActivityListItem[]>([]);
  protected readonly filtersExpanded = signal(false);
  protected readonly expandedResponseIds = signal<Set<string>>(new Set());
  protected readonly isExportingCsv = signal(false);

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.listPage.set(1);
        this.loadActivities();
      });

    this.loadActivities();
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
    this.loadActivities();
  }

  protected toggleFilters(): void {
    this.filtersExpanded.update((open) => !open);
  }

  protected clearFilters(): void {
    this.filterForm.reset(
      {
        search: '',
        status: '',
        model: '',
        latencyBucket: '',
        sort: 'createdAt',
        order: 'desc',
      },
      { emitEvent: false },
    );
    this.listPage.set(1);
    this.loadActivities();
  }

  protected hasActiveFilters(): boolean {
    const f = this.filterForm.getRawValue();
    return (
      !!f.search.trim() ||
      !!f.status.trim() ||
      !!f.model.trim() ||
      !!f.latencyBucket.trim() ||
      f.sort !== 'createdAt' ||
      f.order !== 'desc'
    );
  }

  protected toggleResponseExpand(id: string): void {
    const next = new Set(this.expandedResponseIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedResponseIds.set(next);
  }

  protected isResponseExpanded(id: string): boolean {
    return this.expandedResponseIds().has(id);
  }

  protected shouldTruncate(text: string): boolean {
    return (text?.length || 0) > 250;
  }

  protected getLatencyBadgeClass(responseMs: number): string {
    if (responseMs > 5000) return 'admin-assistant__latency-badge is-very-slow';
    if (responseMs > 2000) return 'admin-assistant__latency-badge is-slow';
    return 'admin-assistant__latency-badge is-fast';
  }

  protected async copyText(label: 'Prompt' | 'Response', value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value || '');
      this.toast.showSuccess(`${label} copied.`);
    } catch {
      this.toast.showError(`Failed to copy ${label.toLowerCase()}.`);
    }
  }

  protected exportCsv(): void {
    if (this.isExportingCsv()) {
      return;
    }
    const rows = this.rows();
    if (!rows.length) {
      this.toast.showError('No rows to export.');
      return;
    }
    this.isExportingCsv.set(true);
    const csv = this.buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assistant-activity-page-${this.listPage()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.isExportingCsv.set(false);
    this.toast.showSuccess('CSV exported successfully.');
  }

  private buildCsv(rows: AdminAssistantActivityListItem[]): string {
    const header = [
      'Created At',
      'User',
      'Email',
      'Model',
      'Status',
      'Response Ms',
      'Relevant Events',
      'Prompt',
      'Response',
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((row) =>
      [
        row.createdAt,
        row.userId?.name ?? 'Guest',
        row.userId?.email ?? '',
        row.model ?? '',
        row.status ?? '',
        row.responseMs ?? 0,
        row.relevantEventsCount ?? 0,
        row.userQuery ?? '',
        row.aiResponse ?? '',
      ]
        .map(escape)
        .join(','),
    );
    return [header.join(','), ...lines].join('\n');
  }

  private loadActivities(): void {
    const requestId = ++this.latestRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const f = this.filterForm.getRawValue();
    const latencyBucket = f.latencyBucket;
    const minResponseMs = latencyBucket === 'verySlow' ? 5001 : latencyBucket === 'slow' ? 2001 : undefined;

    this.adminApi
      .getAssistantActivities({
        page: this.listPage(),
        limit: ADMIN_LIST_PAGE_SIZE,
        search: f.search || undefined,
        status: f.status || undefined,
        model: f.model || undefined,
        sort: f.sort,
        order: f.order,
        minResponseMs,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (requestId !== this.latestRequestId) {
            return;
          }
          const list = res.data?.activities ?? [];
          const total = res.total ?? 0;
          const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));

          this.rows.set(list);
          this.listTotalPages.set(totalPages);
          this.totalListItems.set(total);
        },
        error: (err) => {
          if (requestId !== this.latestRequestId) {
            return;
          }
          console.error('Failed to load assistant activity:', err);
          this.rows.set([]);
          this.listTotalPages.set(1);
          this.totalListItems.set(0);
          this.errorMessage.set('Failed to load activity logs. Please try again.');
        },
      });
  }
}
