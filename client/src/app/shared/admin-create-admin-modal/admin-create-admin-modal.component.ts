import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  inject,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminDashboardService, CreateAdminPayload } from '../../services/admin-dashboard.service';
import { ToastService } from '../../services/toast.service';
import { Button } from '../button/button';

@Component({
  selector: 'app-admin-create-admin-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
  ],
  templateUrl: './admin-create-admin-modal.component.html',
  styleUrl: './admin-create-admin-modal.component.scss',
})
export class AdminCreateAdminModalComponent {
  readonly closed = output<void>();
  readonly saved = output<void>();

  private readonly adminService = inject(AdminDashboardService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly formFeedbackEl = viewChild<ElementRef<HTMLElement>>('formFeedback');

  protected readonly isSubmitting = signal(false);
  protected readonly formErrorMessage = signal('');

  protected readonly createAdminForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required, 
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    ]],
    confirmPassword: ['', [Validators.required]],
  }, {
    validators: (group) => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { notMatching: true };
    }
  });

  protected closeModal(): void {
    this.closed.emit();
  }

  protected submitCreateAdmin(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.createAdminForm.invalid) {
      this.createAdminForm.markAllAsTouched();
      this.formErrorMessage.set('Please fix the highlighted fields before submitting.');
      this.scrollFormFeedbackIntoView();
      return;
    }

    const value = this.createAdminForm.getRawValue();
    const payload: CreateAdminPayload = {
      name: value.name.trim(),
      email: value.email.trim(),
      password: value.password,
      confirmPassword: value.confirmPassword,
    };

    this.formErrorMessage.set('');
    this.isSubmitting.set(true);

    this.adminService.createAdmin(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Admin created successfully.');
          this.saved.emit();
        },
        error: (error: unknown) => {
          const message = this.resolveErrorMessage(error);
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

  private resolveErrorMessage(error: unknown): string {
    const fallbackMessage = 'Unable to create admin right now. Please try again.';
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const message = String((body as { message?: string }).message ?? '').trim();
        if (message) {
          return message;
        }
      }
    }
    return fallbackMessage;
  }
}
