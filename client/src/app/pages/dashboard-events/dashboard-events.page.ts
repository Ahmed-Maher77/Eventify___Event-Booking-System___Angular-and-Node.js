import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Button } from '../../shared/button/button';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { CreateEventPayload, EventApiItem, EventService } from '../../services/event.service';

@Component({
  selector: 'app-dashboard-events-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HighlightedPageHeadingComponent, Button],
  templateUrl: './dashboard-events.page.html',
  styleUrl: './dashboard-events.page.scss'
})
export class DashboardEventsPage implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
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
  protected isSubmitting = false;
  protected listErrorMessage = '';
  protected formErrorMessage = '';
  protected formSuccessMessage = '';

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
      if (!this.isAddModalOpen) {
        this.resetFormState();
      }
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

  protected submitAddEvent(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.addEventForm.invalid) {
      this.addEventForm.markAllAsTouched();
      this.formErrorMessage = 'Please fix the highlighted fields before submitting.';
      this.formSuccessMessage = '';
      return;
    }

    const value = this.addEventForm.getRawValue();
    const payload: CreateEventPayload = {
      title: value.title.trim(),
      description: value.description.trim(),
      date: new Date(value.date).toISOString(),
      location: value.location.trim(),
      category: value.category,
      capacity: Number(value.capacity),
      price: Number(value.price),
      imageUrl: value.imageUrl.trim() || undefined
    };

    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.isSubmitting = true;

    this.eventService
      .createEvent(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.formSuccessMessage = 'Event created successfully.';
          this.loadEvents();
          this.closeAddEventModal();
        },
        error: (error: unknown) => {
          const fallbackMessage = 'Unable to create event right now. Please try again.';
          if (typeof error === 'object' && error && 'error' in error) {
            const maybeMessage = (error as { error?: { message?: string } }).error?.message;
            this.formErrorMessage = maybeMessage?.trim() || fallbackMessage;
            return;
          }
          this.formErrorMessage = fallbackMessage;
        }
      });
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
    this.addEventForm.markAsPristine();
    this.addEventForm.markAsUntouched();
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }
}
