import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CreateEventPayload,
  EventApiItem,
  EventService,
} from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { Button } from '../button/button';
import { CustomNativeSelectComponent, CustomNativeSelectOption } from '../custom-native-select/custom-native-select';
import { SectionLoader } from '../section-loader/section-loader';

@Component({
  selector: 'app-admin-event-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    SectionLoader,
    CustomNativeSelectComponent,
  ],
  templateUrl: './admin-event-form-modal.component.html',
  styleUrl: './admin-event-form-modal.component.scss',
})
export class AdminEventFormModalComponent {
  private static readonly IMAGE_URL_PATTERN = /^https?:\/\/.+/i;

  readonly editingEventId = input<string | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  private readonly eventService = inject(EventService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly formFeedbackEl = viewChild<ElementRef<HTMLElement>>('formFeedback');

  protected readonly categoryOptions: Array<CreateEventPayload['category']> = [
    'concert',
    'conference',
    'workshop',
    'seminar',
    'sports',
    'other',
  ];

  protected readonly addEventCategorySelectOptions: CustomNativeSelectOption[] =
    this.categoryOptions.map((c) => ({ value: c, label: c }));

  protected readonly isLoadingEventDetail = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly formErrorMessage = signal('');
  protected readonly formSuccessMessage = signal('');
  protected pictureMode: 'file' | 'url' = 'file';
  protected selectedImageName = '';
  private selectedImageFile: File | null = null;
  private previousLoadId: string | null = null;

  protected readonly addEventForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    date: ['', [Validators.required]],
    location: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    category: ['conference' as CreateEventPayload['category'], [Validators.required]],
    capacity: [100, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    effect(() => {
      const editIdRaw = this.editingEventId();
      const editId =
        editIdRaw && /^[a-f0-9]{24}$/i.test(editIdRaw) ? editIdRaw : null;

      if (editId) {
        if (this.previousLoadId !== editId) {
          this.previousLoadId = editId;
          this.loadEventForEdit(editId);
        }
      } else {
        this.previousLoadId = null;
        this.resetFormState();
      }
    });
  }

  protected closeModal(): void {
    this.closed.emit();
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
      imageUrlControl.setValidators([
        Validators.pattern(AdminEventFormModalComponent.IMAGE_URL_PATTERN),
        Validators.maxLength(2000),
      ]);
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
      imageUrl: value.imageUrl.trim() || undefined,
    };
    const payload = this.buildCreateEventPayload(payloadBase);

    const editRaw = this.editingEventId();
    const editId =
      editRaw && /^[a-f0-9]{24}$/i.test(editRaw) ? editRaw : null;

    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');
    this.isSubmitting.set(true);

    const request$ = editId
      ? this.eventService.updateEvent(editId, payload)
      : this.eventService.createEvent(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set('');
        this.toast.showSuccess(editId ? 'Event updated successfully.' : 'Event created successfully.');
        this.saved.emit();
      },
      error: (error: unknown) => {
        const message = this.resolveMutationErrorMessage(error, editId ? 'update' : 'create');
        this.isSubmitting.set(false);
        this.formSuccessMessage.set('');
        this.formErrorMessage.set(message);
        this.toast.showError(message);
        this.scrollFormFeedbackIntoView();
      },
    });
  }

  private scrollFormFeedbackIntoView(): void {
    afterNextRender(
      () => {
        const el = this.formFeedbackEl()?.nativeElement;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      },
      { injector: this.injector },
    );
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
        finalize(() => {
          this.isLoadingEventDetail.set(false);
        }),
      )
      .subscribe({
        next: (res) => {
          const data = res.data;
          if (!data) {
            this.toast.showError('Event not found.');
            this.closeModal();
            return;
          }
          this.patchFormFromEvent(data);
        },
        error: () => {
          this.toast.showError('Unable to load this event for editing.');
          this.closeModal();
        },
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
      imageUrl: '',
    });

    const img = (event.image ?? '').trim();
    if (AdminEventFormModalComponent.IMAGE_URL_PATTERN.test(img)) {
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
      imageUrl: '',
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
      imageUrl: this.pictureMode === 'url' ? payload.imageUrl : undefined,
    };
  }
}
