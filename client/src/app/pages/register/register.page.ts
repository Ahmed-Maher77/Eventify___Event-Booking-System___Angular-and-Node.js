import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../shared/button/button';
import {
  PASSWORD_COMPLEXITY_PATTERN,
  passwordChecklist,
} from '../../shared/password-validation';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Button],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  @ViewChild('authAlert') private authAlert?: ElementRef<HTMLElement>;

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isPasswordVisible = signal(false);
  protected readonly selectedImageName = signal('');
  protected readonly pictureMode = signal<'file' | 'url'>('file');
  private selectedImageFile: File | null = null;

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)]],
    pictureUrl: ['']
  });

  protected get passwordValue(): string {
    return this.registerForm.controls.password.value ?? '';
  }

  private get passwordChecks() {
    return passwordChecklist(this.passwordValue);
  }

  protected get hasMinLength(): boolean {
    return this.passwordChecks.hasMinLength;
  }

  protected get hasUppercase(): boolean {
    return this.passwordChecks.hasUppercase;
  }

  protected get hasLowercase(): boolean {
    return this.passwordChecks.hasLowercase;
  }

  protected get hasNumber(): boolean {
    return this.passwordChecks.hasNumber;
  }

  protected get hasSpecialCharacter(): boolean {
    return this.passwordChecks.hasSpecialCharacter;
  }

  protected get hasOnlyAllowedCharacters(): boolean {
    return this.passwordChecks.hasOnlyAllowedCharacters;
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.selectedImageFile = file;
    this.selectedImageName.set(file?.name ?? '');
  }

  protected removeSelectedImage(fileInput?: HTMLInputElement): void {
    this.selectedImageFile = null;
    this.selectedImageName.set('');

    if (fileInput) {
      fileInput.value = '';
    }
  }

  protected setPictureMode(mode: 'file' | 'url'): void {
    if (this.pictureMode() === mode) {
      return;
    }

    this.pictureMode.set(mode);
    const pictureUrlControl = this.registerForm.controls.pictureUrl;

    if (mode === 'url') {
      this.selectedImageFile = null;
      this.selectedImageName.set('');
      pictureUrlControl.setValidators([Validators.pattern(/^https?:\/\/.+/i)]);
    } else {
      pictureUrlControl.setValue('');
      pictureUrlControl.clearValidators();
    }

    pictureUrlControl.updateValueAndValidity();
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { name, email, password, pictureUrl } = this.registerForm.getRawValue();
    const payload = this.buildRegisterPayload({
      name: name ?? '',
      email: email ?? '',
      password: password ?? '',
      pictureUrl: (pictureUrl ?? '').trim()
    });

    this.authService
      .register(payload)
      .subscribe({
        next: () => {
          const nextRoute = this.authService.isAdmin() ? '/dashboard' : '/';
          void this.router.navigate([nextRoute]);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 429) {
            this.errorMessage.set(
              error.error?.message ??
                'Too many attempts. Wait a few minutes, restart the API server, or set RATE_LIMIT_DISABLED=true in server/.env for local development.',
            );
          } else {
            this.errorMessage.set(
              error.error?.message ?? 'Registration failed. Please try again.',
            );
          }
          this.scrollToErrorMessage();
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((value) => !value);
  }

  private scrollToErrorMessage(): void {
    requestAnimationFrame(() => {
      this.authAlert?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private buildRegisterPayload(payload: {
    name: string;
    email: string;
    password: string;
    pictureUrl: string;
  }): FormData | { name: string; email: string; password: string; pictureUrl?: string } {
    if (this.pictureMode() === 'file' && this.selectedImageFile) {
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('email', payload.email);
      formData.append('password', payload.password);

      if (payload.pictureUrl) {
        formData.append('pictureUrl', payload.pictureUrl);
      }

      formData.append('image', this.selectedImageFile);
      return formData;
    }

    return {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      pictureUrl: this.pictureMode() === 'url' ? payload.pictureUrl || undefined : undefined
    };
  }
}
