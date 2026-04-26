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

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { name, email, password } = this.registerForm.getRawValue();
    this.authService
      .register({
        name: name ?? '',
        email: email ?? '',
        password: password ?? ''
      })
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
}
