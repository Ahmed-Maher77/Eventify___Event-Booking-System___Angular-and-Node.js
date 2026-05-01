import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, ReactiveFormsModule, Button],
  templateUrl: './profile.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', '../../../sass/components/profile-page.scss']
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  protected readonly isCurrentPasswordVisible = signal(false);
  protected readonly isNewPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);
  protected readonly emailNotificationsEnabled = signal(true);
  protected readonly marketingUpdatesEnabled = signal(false);
  protected readonly bookingRemindersEnabled = signal(true);

  protected readonly profileForm = this.fb.group({
    fullName: [this.authService.userData?.name ?? 'Eventify User', [Validators.required, Validators.minLength(2)]],
    email: [
      this.authService.userData?.email ?? 'user@eventify.app',
      [Validators.required, Validators.email]
    ],
    phone: [''],
    location: ['']
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]]
  });

  protected readonly quickStats = [
    { label: 'Bookings', value: '12', tone: 'gold' },
    { label: 'Favorites', value: '08', tone: 'slate' },
    { label: 'Reviews', value: '05', tone: 'mint' }
  ] as const;

  protected readonly initials = computed(() => {
    const name = this.profileForm.controls.fullName.value?.trim() || this.authService.userData?.name || 'Eventify User';
    const parts = name.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected get newPasswordValue(): string {
    return this.passwordForm.controls.newPassword.value ?? '';
  }

  protected get hasMinLength(): boolean {
    return this.newPasswordValue.length >= 6;
  }

  protected get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPasswordValue);
  }

  protected get hasLowercase(): boolean {
    return /[a-z]/.test(this.newPasswordValue);
  }

  protected get hasNumber(): boolean {
    return /\d/.test(this.newPasswordValue);
  }

  protected get hasSpecialCharacter(): boolean {
    return /[@$!%*?&]/.test(this.newPasswordValue);
  }

  protected togglePasswordVisibility(
    field: 'current' | 'new' | 'confirm'
  ): void {
    if (field === 'current') {
      this.isCurrentPasswordVisible.update((value) => !value);
      return;
    }
    if (field === 'new') {
      this.isNewPasswordVisible.update((value) => !value);
      return;
    }
    this.isConfirmPasswordVisible.update((value) => !value);
  }

  protected saveProfile(): void {
    this.profileForm.markAllAsTouched();
  }

  protected updatePassword(): void {
    this.passwordForm.markAllAsTouched();
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected deleteAccount(): void {
    // Placeholder action for future backend integration.
  }
}
