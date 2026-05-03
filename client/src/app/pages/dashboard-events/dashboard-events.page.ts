import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  afterNextRender,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import {
  CreateEventPayload,
  EventApiItem,
  EventQueryOptions,
  EventService,
  EventSortField,
  EventSortOrder,
  EventStatusFilter,
} from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

type CatalogPaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HighlightedPageHeadingComponent, Button, SectionLoader],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage implements OnInit, OnDestroy {
  private static readonly IMAGE_URL_PATTERN = /^https?:\/\/.+/i;
  private static readonly CATALOG_IMAGE_FALLBACK = '/images/event-placeholder.svg';
  private readonly eventService = inject(EventService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly destroy$ = new Subject<void>();
  private readonly formFeedbackEl = viewChild<ElementRef<HTMLElement>>('formFeedback');

  protected readonly categoryOptions: Array<CreateEventPayload['category']> = [
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other'
  ];

  protected readonly catalogSortOptions: { value: EventSortField; label: string }[] = [
    { value: 'date', label: 'Date' },
    { value: 'title', label: 'Title' },
    { value: 'price', label: 'Price' },
    { value: 'createdAt', label: 'Created' }
  ];

  protected readonly catalogOrderOptions: { value: EventSortOrder; label: string }[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];

  protected readonly catalogStatusOptions: { value: '' | EventStatusFilter; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  protected readonly catalogFilterForm = this.fb.nonNullable.group({
    search: [''],
    location: [''],
    category: [''],
    status: [''],
    sort: ['date' as EventSortField],
    order: ['asc' as EventSortOrder]
  });
  protected readonly events = signal<EventApiItem[]>([]);
  protected readonly isLoadingEvents = signal(false);
  protected readonly catalogPage = signal(1);
  protected readonly catalogTotalPages = signal(1);
  protected readonly catalogTotalEvents = signal(0);
  protected readonly catalogPageSize = EventService.MAX_EVENTS_PER_PAGE;
  protected readonly catalogFiltersExpanded = signal(false);
  protected isAddModalOpen = false;
  protected readonly editingEventId = signal<string | null>(null);
  protected readonly isLoadingEventDetail = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly eventPendingDelete = signal<EventApiItem | null>(null);
  protected readonly isDeletingEvent = signal(false);
  private previousEditId: string | null = null;
  protected listErrorMessage = '';
  protected readonly formErrorMessage = signal('');
  protected readonly formSuccessMessage = signal('');
  protected pictureMode: 'file' | 'url' = 'file';
  protected isCategorySelectActive = false;
  protected selectedImageName = '';
  private selectedImageFile: File | null = null;

  protected readonly addEventForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    date: ['', [Validators.required]],
    location: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    category: ['conference' as CreateEventPayload['category'], [Validators.required]],
    capacity: [100, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['', [Validators.maxLength(2000)]]
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const editParam = params.get('editEvent');
      const addOpen = params.get('addEvent') === 'true';
      const editId =
        editParam && /^[a-f0-9]{24}$/i.test(editParam) ? editParam : null;

      if (editId) {
        this.isAddModalOpen = true;
        this.editingEventId.set(editId);
        if (this.previousEditId !== editId) {
          this.previousEditId = editId;
          this.loadEventForEdit(editId);
        }
        return;
      }

      this.previousEditId = null;
      this.editingEventId.set(null);

      if (addOpen) {
        this.isAddModalOpen = true;
        this.resetFormState();
        return;
      }

      this.isAddModalOpen = false;
      this.resetFormState();
    });

    this.catalogFilterForm.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.catalogPage.set(1);
        this.loadEvents();
      });

    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected catalogEventImageSrc(event: EventApiItem): string {
    const raw = (event.image ?? '').trim();
    return raw || DashboardEventsPage.CATALOG_IMAGE_FALLBACK;
  }

  protected catalogHasPreviousPage(): boolean {
    return this.catalogPage() > 1;
  }

  protected catalogHasNextPage(): boolean {
    return this.catalogPage() < this.catalogTotalPages();
  }

  protected get catalogPaginationTokens(): CatalogPaginationToken[] {
    const total = this.catalogTotalPages();
    const current = this.catalogPage();
    if (total <= 0) {
      return [];
    }
    if (total <= 5) {
      return Array.from({ length: total }, (_, idx) => idx + 1);
    }
    const tokens: CatalogPaginationToken[] = [1];
    const middleStart = Math.max(2, current - 1);
    const middleEnd = Math.min(total - 1, current + 1);
    if (middleStart > 2) {
      tokens.push('ellipsis-left');
    }
    for (let page = middleStart; page <= middleEnd; page += 1) {
      tokens.push(page);
    }
    if (middleEnd < total - 1) {
      tokens.push('ellipsis-right');
    }
    tokens.push(total);
    return tokens;
  }

  protected goToCatalogPage(page: number): void {
    const total = this.catalogTotalPages();
    const next = Math.max(1, Math.min(page, total));
    if (next === this.catalogPage()) {
      return;
    }
    this.catalogPage.set(next);
    this.loadEvents();
  }

  protected goToCatalogPreviousPage(): void {
    this.goToCatalogPage(this.catalogPage() - 1);
  }

  protected goToCatalogNextPage(): void {
    this.goToCatalogPage(this.catalogPage() + 1);
  }

  protected clearCatalogFilters(): void {
    this.catalogFilterForm.reset(
      {
        search: '',
        location: '',
        category: '',
        status: '',
        sort: 'date',
        order: 'asc'
      },
      { emitEvent: false }
    );
    this.catalogPage.set(1);
    this.loadEvents();
  }

  protected hasActiveCatalogFilters(): boolean {
    const v = this.catalogFilterForm.getRawValue();
    return !!(
      (v.search ?? '').trim() ||
      (v.location ?? '').trim() ||
      (v.category ?? '').trim() ||
      (v.status ?? '').trim()
    );
  }

  protected toggleCatalogFilters(): void {
    this.catalogFiltersExpanded.update((open) => !open);
  }

  protected openAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: 'true', editEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected openEditEventModal(event: EventApiItem): void {
    if (!event?._id) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editEvent: event._id, addEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected openDeleteConfirm(event: EventApiItem): void {
    if (!event?._id) {
      return;
    }
    this.eventPendingDelete.set(event);
  }

  protected closeDeleteConfirm(): void {
    if (this.isDeletingEvent()) {
      return;
    }
    this.eventPendingDelete.set(null);
  }

  protected confirmDeleteEvent(): void {
    const pending = this.eventPendingDelete();
    if (!pending?._id || this.isDeletingEvent()) {
      return;
    }
    const id = pending._id;
    this.isDeletingEvent.set(true);

    this.eventService
      .deleteEvent(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isDeletingEvent.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('Event deleted successfully.');
          this.eventPendingDelete.set(null);
          const editParam = this.route.snapshot.queryParamMap.get('editEvent');
          if (editParam === id) {
            this.closeAddEventModal();
          }
          this.loadEvents();
        },
        error: (error: unknown) => {
          const message = this.resolveDeleteErrorMessage(error);
          this.toast.showError(message);
        }
      });
  }

  protected closeAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: null, editEvent: null },
      queryParamsHandling: 'merge'
    });
  }

  protected setPictureMode(mode: 'file' | 'url'): void {
    if (this.pictureMode === mode) {
      return;
    }

    this.pictureMode = mode;
    const imageUrlControl = this.addEventForm.controls.imageUrl;

    if (mode === 'url') {
      this.selectedImageFile = null;
      this.selectedImageName = '';
      imageUrlControl.setValidators([Validators.pattern(DashboardEventsPage.IMAGE_URL_PATTERN), Validators.maxLength(2000)]);
    } else {
      imageUrlControl.setValue('');
      imageUrlControl.setValidators([Validators.maxLength(2000)]);
    }

    imageUrlControl.updateValueAndValidity();
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedImageFile = file;
    this.selectedImageName = file?.name ?? '';
    this.formErrorMessage.set('');
  }

  protected setCategorySelectActive(isActive: boolean): void {
    this.isCategorySelectActive = isActive;
  }

  protected removeSelectedImage(fileInput?: HTMLInputElement): void {
    this.selectedImageFile = null;
    this.selectedImageName = '';
    if (fileInput) {
      fileInput.value = '';
    }
  }

  protected submitAddEvent(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.addEventForm.invalid) {
      this.addEventForm.markAllAsTouched();
      this.formErrorMessage.set('Please fix the highlighted fields before submitting.');
      this.formSuccessMessage.set('');
      this.scrollFormFeedbackIntoView();
      return;
    }

    const value = this.addEventForm.getRawValue();
    const payloadBase: CreateEventPayload = {
      title: value.title.trim(),
      description: value.description.trim(),
      date: new Date(value.date).toISOString(),
      location: value.location.trim(),
      category: value.category,
      capacity: Number(value.capacity),
      price: Number(value.price),
      imageUrl: value.imageUrl.trim() || undefined
    };
    const payload = this.buildCreateEventPayload(payloadBase);

    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
    this.isSubmitting.set(true);

    const editParam = this.route.snapshot.queryParamMap.get('editEvent');
    const editId =
      editParam && /^[a-f0-9]{24}$/i.test(editParam) ? editParam : null;
    const request$ = editId
      ? this.eventService.updateEvent(editId, payload)
      : this.eventService.createEvent(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set('');
        this.toast.showSuccess(editId ? 'Event updated successfully.' : 'Event created successfully.');
        this.loadEvents();
        this.closeAddEventModal();
      },
      error: (error: unknown) => {
        const message = this.resolveMutationErrorMessage(error, editId ? 'update' : 'create');
        this.isSubmitting.set(false);
        this.formSuccessMessage.set('');
        this.formErrorMessage.set(message);
        this.toast.showError(message);
        this.scrollFormFeedbackIntoView();
      }
    });
  }

  private scrollFormFeedbackIntoView(): void {
    afterNextRender(
      () => {
        const el = this.formFeedbackEl()?.nativeElement;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      },
      { injector: this.injector }
    );
  }

  private resolveDeleteErrorMessage(error: unknown): string {
    const fallbackMessage = 'Unable to delete this event. Please try again.';
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = String((body as { message?: string }).message ?? '').trim();
        if (message) {
          return message;
        }
      }
      return fallbackMessage;
    }
    return fallbackMessage;
  }

  private resolveMutationErrorMessage(error: unknown, action: 'create' | 'update'): string {
    const fallbackMessage =
      action === 'update'
        ? 'Unable to update event right now. Please try again.'
        : 'Unable to create event right now. Please try again.';
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = String((body as { message?: string }).message ?? '').trim();
        if (message) {
          return message;
        }
      }
      return fallbackMessage;
    }
    if (typeof error === 'object' && error && 'error' in error) {
      const maybeMessage = (error as { error?: { message?: string } }).error?.message?.trim();
      return maybeMessage || fallbackMessage;
    }
    return fallbackMessage;
  }

  private loadEventForEdit(id: string): void {
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
    this.isLoadingEventDetail.set(true);

    this.eventService
      .getEvent(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingEventDetail.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          const data = res.data;
          if (!data) {
            this.toast.showError('Event not found.');
            this.closeAddEventModal();
            return;
          }
          this.patchFormFromEvent(data);
        },
        error: () => {
          this.toast.showError('Unable to load this event for editing.');
          this.closeAddEventModal();
        }
      });
  }

  private patchFormFromEvent(event: EventApiItem): void {
    const rawCat = String(event.category ?? '').toLowerCase() as CreateEventPayload['category'];
    const category = this.categoryOptions.includes(rawCat) ? rawCat : 'conference';

    this.addEventForm.patchValue({
      title: event.title ?? '',
      description: (event.description ?? '').trim(),
      date: this.toDatetimeLocalValue(event.date),
      location: event.location ?? '',
      category,
      capacity: event.capacity ?? 100,
      price: event.price ?? 0,
      imageUrl: ''
    });

    const img = (event.image ?? '').trim();
    if (DashboardEventsPage.IMAGE_URL_PATTERN.test(img)) {
      this.setPictureMode('url');
      this.addEventForm.patchValue({ imageUrl: img });
    } else {
      this.setPictureMode('file');
    }

    this.addEventForm.markAsPristine();
    this.addEventForm.markAsUntouched();
    this.isSubmitting.set(false);
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
  }

  private toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private buildCatalogQueryOptions(): EventQueryOptions {
    const f = this.catalogFilterForm.getRawValue();
    const search = (f.search ?? '').trim();
    const location = (f.location ?? '').trim();
    const category = (f.category ?? '').trim();
    const statusRaw = (f.status ?? '').trim().toLowerCase();
    const allowedStatus: EventStatusFilter[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    const status = allowedStatus.includes(statusRaw as EventStatusFilter)
      ? (statusRaw as EventStatusFilter)
      : undefined;
    const sort = (f.sort ?? 'date') as EventSortField;
    const order = (f.order ?? 'asc') as EventSortOrder;

    return {
      page: this.catalogPage(),
      limit: this.catalogPageSize,
      sort,
      order,
      search: search || undefined,
      location: location || undefined,
      category: category || undefined,
      status
    };
  }

  private loadEvents(): void {
    this.isLoadingEvents.set(true);
    this.listErrorMessage = '';

    this.eventService
      .getEvents(this.buildCatalogQueryOptions())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const list = response.data?.events ?? [];
          const pag = response.data?.pagination;
          const totalPages = Math.max(1, pag?.totalPages ?? 1);
          const totalEvents = pag?.totalEvents ?? list.length;
          const current = this.catalogPage();

          if (current > totalPages) {
            this.catalogPage.set(totalPages);
            this.loadEvents();
            return;
          }

          this.catalogTotalPages.set(totalPages);
          this.catalogTotalEvents.set(totalEvents);
          this.events.set(list);
          this.isLoadingEvents.set(false);
        },
        error: () => {
          this.events.set([]);
          this.catalogTotalPages.set(1);
          this.catalogTotalEvents.set(0);
          this.listErrorMessage = 'Unable to load event catalog at the moment.';
          this.isLoadingEvents.set(false);
        },
      });
  }

  private resetFormState(): void {
    this.isLoadingEventDetail.set(false);
    this.addEventForm.reset({
      title: '',
      description: '',
      date: '',
      location: '',
      category: 'conference',
      capacity: 100,
      price: 0,
      imageUrl: ''
    });
    this.pictureMode = 'file';
    this.selectedImageFile = null;
    this.selectedImageName = '';
    this.addEventForm.controls.imageUrl.setValidators([Validators.maxLength(2000)]);
    this.addEventForm.controls.imageUrl.updateValueAndValidity({ emitEvent: false });
    this.addEventForm.markAsPristine();
    this.addEventForm.markAsUntouched();
    this.isSubmitting.set(false);
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
  }

  private buildCreateEventPayload(payload: CreateEventPayload): CreateEventPayload | FormData {
    if (this.pictureMode === 'file' && this.selectedImageFile) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('date', payload.date);
      formData.append('location', payload.location);
      formData.append('category', payload.category);
      formData.append('capacity', String(payload.capacity));
      formData.append('price', String(payload.price));
      if (payload.imageUrl) {
        formData.append('imageUrl', payload.imageUrl);
      }
      formData.append('image', this.selectedImageFile);
      return formData;
    }

    return {
      ...payload,
      imageUrl: this.pictureMode === 'url' ? payload.imageUrl : undefined
    };
  }
}
