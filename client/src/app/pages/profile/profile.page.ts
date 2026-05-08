import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { AuthService } from '../../services/auth.service';
import { FavoriteService } from '../../services/favorite.service';
import { ToastService } from '../../services/toast.service';
import { resolveAvatarUrl } from '../../utils/avatar-url';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, ReactiveFormsModule, Button],
  templateUrl: './profile.page.html',
  styleUrls: [
    '../../../sass/components/static-info-page.scss',
    '../../../sass/components/profile-page.scss',
  ],
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly toast = inject(ToastService);
  private readonly initialProfileFormValue = {
    fullName: this.authService.userData?.name ?? 'Eventify User',
    email: this.authService.userData?.email ?? 'user@eventify.app',
    phone: this.authService.userData?.phone ?? '',
    location: this.authService.userData?.location ?? '',
  };
  private readonly initialPreferenceValues = {
    emailNotificationsEnabled: this.authService.userData?.emailNotificationsEnabled ?? true,
    marketingUpdatesEnabled: this.authService.userData?.marketingUpdatesEnabled ?? false,
    bookingRemindersEnabled: this.authService.userData?.bookingRemindersEnabled ?? true,
  };

  protected readonly isCurrentPasswordVisible = signal(false);
  protected readonly isNewPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);
  protected readonly emailNotificationsEnabled = signal(this.initialPreferenceValues.emailNotificationsEnabled);
  protected readonly marketingUpdatesEnabled = signal(this.initialPreferenceValues.marketingUpdatesEnabled);
  protected readonly bookingRemindersEnabled = signal(this.initialPreferenceValues.bookingRemindersEnabled);
  protected readonly isProfileEditMode = signal(false);

  protected readonly profileForm = this.fb.group({
    fullName: [this.initialProfileFormValue.fullName, [Validators.required, Validators.minLength(2)]],
    email: [this.initialProfileFormValue.email, [Validators.required, Validators.email]],
    phone: [this.initialProfileFormValue.phone],
    location: [this.initialProfileFormValue.location],
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  });

  protected readonly favoriteCount = signal(0);
  protected readonly deleteAccountConfirmOpen = signal(false);
  protected readonly deleteAccountBusy = signal(false);
  protected readonly saveProfileBusy = signal(false);
  protected readonly updatePasswordBusy = signal(false);

  protected get quickStats(): { label: string; value: string; tone: 'gold' | 'slate' | 'mint' }[] {
    return [
      { label: 'Bookings', value: '12', tone: 'gold' },
      { label: 'Favorites', value: String(this.favoriteCount()).padStart(2, '0'), tone: 'slate' },
      { label: 'Reviews', value: '05', tone: 'mint' },
    ];
  }

  protected getProfileImageUrl(): string {
    const displayName =
      this.profileForm.controls.fullName.value ??
      this.authService.userData?.name ??
      'Eventify User';
    return resolveAvatarUrl(displayName, this.authService.userData?.pictureUrl);
  }

  protected readonly initials = computed(() => {
    const name =
      this.profileForm.controls.fullName.value?.trim() ||
      this.authService.userData?.name ||
      'Eventify User';
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

  ngOnInit(): void {
    this.applyProfileEditMode(false);
    if (!this.authService.isLoggedIn()) {
      this.favoriteCount.set(0);
      return;
    }
    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        this.favoriteCount.set(response.data?.totalFavorites ?? 0);
      },
      error: () => {
        this.favoriteCount.set(0);
      },
    });
  }

  protected togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (!this.isProfileEditMode()) {
      return;
    }
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
    if (!this.isProfileEditMode()) {
      return;
    }
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      return;
    }
    const fullName = this.profileForm.controls.fullName.value?.trim() ?? '';
    const phone = this.profileForm.controls.phone.value?.trim() ?? '';
    const location = this.profileForm.controls.location.value?.trim() ?? '';
    this.saveProfileBusy.set(true);
    this.authService
      .updateMyProfile({
        name: fullName,
        phone,
        location,
        emailNotificationsEnabled: this.emailNotificationsEnabled(),
        marketingUpdatesEnabled: this.marketingUpdatesEnabled(),
        bookingRemindersEnabled: this.bookingRemindersEnabled(),
      })
      .pipe(finalize(() => this.saveProfileBusy.set(false)))
      .subscribe({
        next: (res) => {
          this.initialProfileFormValue.fullName = fullName;
          this.initialProfileFormValue.phone = phone;
          this.initialProfileFormValue.location = location;
          this.initialPreferenceValues.emailNotificationsEnabled = this.emailNotificationsEnabled();
          this.initialPreferenceValues.marketingUpdatesEnabled = this.marketingUpdatesEnabled();
          this.initialPreferenceValues.bookingRemindersEnabled = this.bookingRemindersEnabled();
          this.profileForm.patchValue({
            fullName,
            phone,
            location,
          });
          this.applyProfileEditMode(false);
          this.toast.showSuccess(res.message ?? 'Profile updated successfully.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update profile right now.',
          );
        },
      });
  }

  protected toggleProfileEditMode(): void {
    if (this.saveProfileBusy() || this.updatePasswordBusy()) {
      return;
    }
    if (this.isProfileEditMode()) {
      this.profileForm.reset(this.initialProfileFormValue);
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      this.emailNotificationsEnabled.set(this.initialPreferenceValues.emailNotificationsEnabled);
      this.marketingUpdatesEnabled.set(this.initialPreferenceValues.marketingUpdatesEnabled);
      this.bookingRemindersEnabled.set(this.initialPreferenceValues.bookingRemindersEnabled);
      this.passwordForm.reset();
      this.isCurrentPasswordVisible.set(false);
      this.isNewPasswordVisible.set(false);
      this.isConfirmPasswordVisible.set(false);
      this.applyProfileEditMode(false);
      return;
    }
    this.applyProfileEditMode(true);
  }

  protected updatePassword(): void {
    if (!this.isProfileEditMode()) {
      return;
    }
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      return;
    }
    const currentPassword = this.passwordForm.controls.currentPassword.value ?? '';
    const newPassword = this.passwordForm.controls.newPassword.value ?? '';
    const confirmPassword = this.passwordForm.controls.confirmPassword.value ?? '';
    if (newPassword !== confirmPassword) {
      this.toast.showError('New password and confirm password do not match.');
      return;
    }
    this.updatePasswordBusy.set(true);
    this.authService
      .updateMyPassword({ currentPassword, newPassword, confirmPassword })
      .pipe(finalize(() => this.updatePasswordBusy.set(false)))
      .subscribe({
        next: (res) => {
          this.passwordForm.reset();
          this.isCurrentPasswordVisible.set(false);
          this.isNewPasswordVisible.set(false);
          this.isConfirmPasswordVisible.set(false);
          this.applyProfileEditMode(false);
          this.toast.showSuccess(res.message ?? 'Password updated successfully.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update password right now.',
          );
        },
      });
  }

  protected togglePreference(
    key: 'emailNotificationsEnabled' | 'marketingUpdatesEnabled' | 'bookingRemindersEnabled',
  ): void {
    if (!this.isProfileEditMode()) {
      return;
    }
    if (key === 'emailNotificationsEnabled') {
      this.emailNotificationsEnabled.update((value) => !value);
      return;
    }
    if (key === 'marketingUpdatesEnabled') {
      this.marketingUpdatesEnabled.update((value) => !value);
      return;
    }
    this.bookingRemindersEnabled.update((value) => !value);
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected deleteAccount(): void {
    this.deleteAccountConfirmOpen.set(true);
  }

  protected closeDeleteAccountConfirm(): void {
    if (this.deleteAccountBusy()) return;
    this.deleteAccountConfirmOpen.set(false);
  }

  protected confirmDeleteAccount(): void {
    if (this.deleteAccountBusy()) return;
    this.deleteAccountBusy.set(true);
    this.authService
      .deleteMyAccount()
      .pipe(finalize(() => this.deleteAccountBusy.set(false)))
      .subscribe({
        next: (res) => {
          this.deleteAccountConfirmOpen.set(false);
          this.toast.showSuccess(res.message ?? 'Your account was deleted successfully.');
          this.authService.logout();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to delete your account right now. Please try again.',
          );
        },
      });
  }

  private applyProfileEditMode(enabled: boolean): void {
    this.isProfileEditMode.set(enabled);
    if (enabled) {
      this.profileForm.enable({ emitEvent: false });
      this.profileForm.controls.email.disable({ emitEvent: false });
      return;
    }
    this.profileForm.disable({ emitEvent: false });
  }
}
