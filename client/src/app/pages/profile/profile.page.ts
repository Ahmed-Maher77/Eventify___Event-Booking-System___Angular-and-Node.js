import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Button } from '../../shared/button/button';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { EventReviewService } from '../../services/event-review.service';
import { FavoriteService } from '../../services/favorite.service';
import { ToastService } from '../../services/toast.service';
import { resolveAvatarUrl } from '../../utils/avatar-url';
import { ProfileAvatarEditorComponent } from './components/profile-avatar-editor/profile-avatar-editor.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, ReactiveFormsModule, Button, ProfileAvatarEditorComponent],
  templateUrl: './profile.page.html',
  styleUrls: [
    '../../../sass/components/static-info-page.scss',
    '../../../sass/components/profile-page.scss',
  ],
})
export class ProfilePage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly eventReviewService = inject(EventReviewService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly toast = inject(ToastService);
  private readonly subscriptions = new Subscription();
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
  protected readonly emailNotificationsEnabled = signal(
    this.initialPreferenceValues.emailNotificationsEnabled,
  );
  protected readonly marketingUpdatesEnabled = signal(
    this.initialPreferenceValues.marketingUpdatesEnabled,
  );
  protected readonly bookingRemindersEnabled = signal(
    this.initialPreferenceValues.bookingRemindersEnabled,
  );
  protected readonly isProfileEditMode = signal(false);

  protected readonly profileForm = this.fb.group({
    fullName: [
      this.initialProfileFormValue.fullName,
      [Validators.required, Validators.minLength(2)],
    ],
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
  protected readonly bookingCount = signal(0);
  protected readonly reviewCount = signal(0);
  protected readonly deleteAccountConfirmOpen = signal(false);
  protected readonly deleteAccountBusy = signal(false);
  protected readonly updateAvatarBusy = signal(false);
  protected readonly saveProfileBusy = signal(false);
  protected readonly updatePasswordBusy = signal(false);

  protected get quickStats(): { label: string; value: string; tone: 'gold' | 'slate' | 'mint' }[] {
    return [
      { label: 'Bookings', value: String(this.bookingCount()).padStart(2, '0'), tone: 'gold' },
      { label: 'Favorites', value: String(this.favoriteCount()).padStart(2, '0'), tone: 'slate' },
      { label: 'Reviews', value: String(this.reviewCount()).padStart(2, '0'), tone: 'mint' },
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
      this.bookingCount.set(0);
      this.favoriteCount.set(0);
      this.reviewCount.set(0);
      return;
    }
    this.subscriptions.add(
      this.favoriteService.totalFavorites$.subscribe((count) => {
        this.favoriteCount.set(count);
      }),
    );
    this.subscriptions.add(
      this.favoriteService.getFavorites().subscribe({
        next: (response) => {
          this.favoriteCount.set(response.data?.totalFavorites ?? 0);
        },
        error: () => {
          this.favoriteCount.set(0);
        },
      }),
    );
    this.subscriptions.add(
      this.bookingService.getUserBookingsSummary().subscribe({
        next: (response) => {
          this.bookingCount.set(response.data?.pagination?.totalBookings ?? 0);
        },
        error: () => {
          this.bookingCount.set(0);
        },
      }),
    );
    void this.refreshReviewCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
            typeof msg === 'string' && msg.trim() ? msg : 'Unable to update profile right now.',
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
            typeof msg === 'string' && msg.trim() ? msg : 'Unable to update password right now.',
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

  protected onAvatarFileSelected(file: File | null): void {
    if (!file) {
      return;
    }

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      this.toast.showError('Please select a JPG, PNG, or WEBP image.');
      return;
    }

    this.updateAvatarBusy.set(true);
    const payload = new FormData();
    payload.append(
      'name',
      this.profileForm.controls.fullName.value?.trim() ||
        this.authService.userData?.name ||
        'Eventify User',
    );
    payload.append('image', file);

    this.authService
      .updateMyProfile(payload)
      .pipe(finalize(() => this.updateAvatarBusy.set(false)))
      .subscribe({
        next: (res) => {
          this.toast.showSuccess(res.message ?? 'Profile image updated successfully.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to update profile image right now.',
          );
        },
      });
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

  private async refreshReviewCount(): Promise<void> {
    try {
      const eventIds = new Set<string>();
      let page = 1;
      let totalPages = 1;
      const limit = 100;

      do {
        const response = await firstValueFrom(this.bookingService.getUserBookings({ page, limit }));
        const data = response.data;
        const bookings = data?.bookings ?? [];
        const pagination = data?.pagination;
        totalPages = Math.max(1, pagination?.totalPages ?? 1);

        for (const booking of bookings) {
          const eventId = booking.eventId;
          const id = typeof eventId === 'string' ? eventId : eventId?._id;
          if (id) {
            eventIds.add(id);
          }
        }

        page += 1;
      } while (page <= totalPages);

      if (!eventIds.size) {
        this.reviewCount.set(0);
        return;
      }

      const reviewChecks = await Promise.all(
        [...eventIds].map(async (eventId) => {
          try {
            const status = await firstValueFrom(this.eventReviewService.getReviewStatus(eventId));
            return !!status.data?.hasReviewed;
          } catch {
            return false;
          }
        }),
      );

      this.reviewCount.set(reviewChecks.filter(Boolean).length);
    } catch {
      this.reviewCount.set(0);
    }
  }
}
