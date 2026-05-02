import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { CreateEventPayload, EventApiItem, EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HighlightedPageHeadingComponent, Button],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage implements OnInit, OnDestroy {
  private static readonly IMAGE_URL_PATTERN = /^https?:\/\/.+/i;
  private readonly eventService = inject(EventService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly categoryOptions: Array<CreateEventPayload['category']> = [
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other'
  ];
  protected events: EventApiItem[] = [];
  protected isLoadingEvents = false;
  protected isAddModalOpen = false;
  protected readonly isSubmitting = signal(false);
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
      this.isAddModalOpen = params.get('addEvent') === 'true';
      this.syncModalState(this.isAddModalOpen);
    });

    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected openAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: 'true' },
      queryParamsHandling: 'merge'
    });
  }

  protected closeAddEventModal(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addEvent: null },
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

    this.eventService
      .createEvent(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.formErrorMessage.set('');
          this.toast.showSuccess('Event created successfully.');
          this.loadEvents();
          this.closeAddEventModal();
        },
        error: (error: unknown) => {
          const message = this.resolveCreateEventErrorMessage(error);
          this.isSubmitting.set(false);
          this.formSuccessMessage.set('');
          this.formErrorMessage.set(message);
          this.toast.showError(message);
        }
      });
  }

  private resolveCreateEventErrorMessage(error: unknown): string {
    const fallbackMessage = 'Unable to create event right now. Please try again.';
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

  private loadEvents(): void {
    this.isLoadingEvents = true;
    this.listErrorMessage = '';

    this.eventService
      .getEvents({ page: 1, limit: 50, sort: 'date', order: 'asc' })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingEvents = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.events = response.data?.events ?? [];
        },
        error: () => {
          this.events = [];
          this.listErrorMessage = 'Unable to load event catalog at the moment.';
        }
      });
  }

  private resetFormState(): void {
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

  private syncModalState(isOpen: boolean): void {
    if (isOpen) {
      this.isAddModalOpen = true;
      return;
    }

    this.isAddModalOpen = false;
    this.resetFormState();
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
