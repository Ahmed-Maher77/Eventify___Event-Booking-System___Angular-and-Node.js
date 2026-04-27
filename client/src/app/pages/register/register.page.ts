import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html'
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly selectedImageName = signal('');
  protected readonly pictureMode = signal<'file' | 'url'>('file');
  private selectedImageFile: File | null = null;

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    pictureUrl: ['']
  });

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.selectedImageFile = file;
    this.selectedImageName.set(file?.name ?? '');
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
          this.errorMessage.set(error.error?.message ?? 'Registration failed. Please try again.');
          this.isSubmitting.set(false);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
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
