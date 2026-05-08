import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import {
  EventReviewItem,
  EventReviewService,
  ReviewVoteValue,
} from '../../services/event-review.service';
import { EventApiItem, EventService } from '../../services/event.service';
import { FavoriteService } from '../../services/favorite.service';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../shared/button/button';
import {
  CustomNativeSelectComponent,
  CustomNativeSelectOption,
} from '../../shared/custom-native-select/custom-native-select';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { resolveAvatarUrl } from '../../utils/avatar-url';

@Component({
  selector: 'app-event-details-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SectionLoader,
    Button,
    CustomNativeSelectComponent,
  ],
  templateUrl: './event-details.page.html',
  styleUrl: './event-details.page.scss',
})
export class EventDetailsPage implements OnInit {
  private static readonly IMAGE_FALLBACK = '/images/event-placeholder.svg';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  protected readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoriteService);
  private readonly bookings = inject(BookingService);
  private readonly reviewsApi = inject(EventReviewService);
  private readonly toast = inject(ToastService);

  protected readonly event = signal<EventApiItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isFavorite = signal(false);
  protected readonly favoriteBusy = signal(false);

  protected readonly bookingQuantity = signal(1);
  protected readonly bookingSubmitting = signal(false);
  protected readonly activeBookingId = signal<string | null>(null);

  protected readonly reviews = signal<EventReviewItem[]>([]);
  protected readonly reviewSummary = signal<{
    averageRating: number;
    totalReviews: number;
    distribution: Array<{ level: number; count: number; pct: number }>;
  } | null>(null);
  protected readonly canReview = signal(false);
  protected readonly hasReviewed = signal(false);
  protected readonly reviewBlockReason = signal<string | null>(null);
  protected readonly ownReviewId = signal<string | null>(null);
  protected readonly reviewSubmitting = signal(false);
  protected readonly draftRating = signal(0);
  protected readonly draftMessage = signal('');

  protected readonly reviewSearchTerm = signal('');
  protected readonly ratingFilter = signal<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  protected readonly expandedReviewIds = signal<Record<string, boolean>>({});
  protected readonly voteBusy = signal<Record<string, boolean>>({});
  protected readonly reviewActionBusy = signal<Record<string, boolean>>({});
  protected readonly editingReviewId = signal<string | null>(null);
  protected readonly editRating = signal(0);
  protected readonly editMessage = signal('');
  protected readonly pendingDeleteReview = signal<EventReviewItem | null>(null);

  protected readonly ratingFilterOptions: CustomNativeSelectOption[] = [
    { value: 'all', label: 'All ratings' },
    { value: '5', label: '5 stars' },
    { value: '4', label: '4 stars' },
    { value: '3', label: '3 stars' },
    { value: '2', label: '2 stars' },
    { value: '1', label: '1 star' },
  ];

  protected readonly filteredReviews = computed(() => {
    const q = this.reviewSearchTerm().trim().toLowerCase();
    const f = this.ratingFilter();
    return this.reviews().filter((r) => {
      if (f !== 'all' && r.rating !== Number(f)) return false;
      if (!q) return true;
      const msg = (r.message ?? '').toLowerCase();
      const name = (r.authorName ?? '').toLowerCase();
      return msg.includes(q) || name.includes(q);
    });
  });

  protected readonly avgRatingDisplay = computed(() => {
    const summary = this.reviewSummary();
    if (summary) {
      return summary.totalReviews ? summary.averageRating : null;
    }
    const list = this.reviews();
    if (!list.length) return null;
    const sum = list.reduce((a, r) => a + r.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  protected readonly ratingDistribution = computed(() => {
    const summary = this.reviewSummary();
    if (summary?.distribution?.length) {
      return summary.distribution;
    }
    const list = this.reviews();
    const total = list.length;
    const rows: { level: number; pct: number; count: number }[] = [];
    for (let level = 5; level >= 1; level--) {
      const count = list.filter((r) => r.rating === level).length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      rows.push({ level, pct, count });
    }
    return rows;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')?.trim();
    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('Missing event.');
      return;
    }
    this.loadEvent(id);
  }

  protected coverImageSrc(e: EventApiItem): string {
    const raw = e.image?.trim();
    return raw || EventDetailsPage.IMAGE_FALLBACK;
  }

  protected seatsSnapshot(e: EventApiItem): { available: number; capacity: number } | null {
    if (e.capacity == null || e.availableSeats == null) return null;
    const capacity = Number(e.capacity);
    const available = Number(e.availableSeats);
    if (
      !Number.isFinite(capacity) ||
      capacity < 1 ||
      !Number.isFinite(available) ||
      available < 0
    ) {
      return null;
    }
    return { available, capacity };
  }

  protected canBook(): boolean {
    const ev = this.event();
    if (!ev || ev.status === 'cancelled' || ev.status === 'completed') return false;
    if (this.isEventDatePassed(ev)) return false;
    const seats = this.seatsSnapshot(ev);
    if (seats && seats.available < 1) return false;
    if (this.activeBookingId()) return false;
    return this.auth.isLoggedIn();
  }

  protected bookingUnavailableMessage(ev: EventApiItem): string {
    if (this.isEventDatePassed(ev)) {
      return 'Booking has closed because this event date has already passed.';
    }
    if (this.isSoldOut(ev)) {
      return 'This event is sold out. No seats are currently available.';
    }
    if (ev.status === 'cancelled') {
      return 'Booking is unavailable because this event was cancelled.';
    }
    if (ev.status === 'completed') {
      return 'Booking is unavailable because this event has already ended.';
    }
    const seats = this.seatsSnapshot(ev);
    if (seats && seats.available < 1) {
      return 'No seats are currently available for this event.';
    }
    return 'Booking is not available for this event.';
  }

  protected isSoldOut(ev: EventApiItem): boolean {
    const seats = this.seatsSnapshot(ev);
    return !!seats && seats.available < 1;
  }

  protected hasActiveBookingForCurrentEvent(): boolean {
    return !!this.activeBookingId();
  }

  protected showBookingCta(): boolean {
    const ev = this.event();
    if (!ev || ev.status === 'cancelled') return false;
    return true;
  }

  protected toggleFavorite(): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const id = this.event()?._id;
    if (!id || this.favoriteBusy()) return;
    this.favoriteBusy.set(true);
    this.favorites.toggleFavorite(id).subscribe({
      next: (res) => {
        this.isFavorite.set(res.data?.isFavorite ?? false);
      },
      error: () => this.toast.showError('Could not update favorites.'),
      complete: () => this.favoriteBusy.set(false),
    });
  }

  protected setRating(n: number): void {
    this.draftRating.set(n);
  }

  protected setReviewSearch(value: string): void {
    this.reviewSearchTerm.set(value ?? '');
  }
  protected isOwnReview(r: EventReviewItem): boolean {
    const currentUserId = this.auth.userData?.id;
    if (currentUserId && r.authorId && String(currentUserId) === String(r.authorId)) {
      return true;
    }
    return !!this.ownReviewId() && this.ownReviewId() === r._id;
  }

  protected setRatingFilter(raw: string): void {
    if (raw === 'all' || raw === '1' || raw === '2' || raw === '3' || raw === '4' || raw === '5') {
      this.ratingFilter.set(raw);
    }
  }

  protected reviewAvatarUrl(r: EventReviewItem): string {
    return resolveAvatarUrl(r.authorName ?? 'Guest', r.authorPictureUrl);
  }

  protected starsForAverage(avg: number): ('full' | 'half' | 'empty')[] {
    const out: ('full' | 'half' | 'empty')[] = [];
    let v = Math.max(0, Math.min(5, avg));
    for (let i = 0; i < 5; i++) {
      if (v >= 1) {
        out.push('full');
        v -= 1;
      } else if (v >= 0.5) {
        out.push('half');
        v = 0;
      } else if (v >= 0.25) {
        out.push('half');
        v = 0;
      } else {
        out.push('empty');
      }
    }
    return out;
  }

  protected starsForRating(rating: number): boolean[] {
    const n = Math.max(0, Math.min(5, Math.round(rating)));
    return Array.from({ length: 5 }, (_, i) => i < n);
  }

  protected relativeReviewTime(iso: string): string {
    const d = new Date(iso);
    const ms = Date.now() - d.getTime();
    if (!Number.isFinite(ms)) return '';
    const s = Math.floor(ms / 1000);
    if (s < 45) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  protected isReviewExpanded(id: string): boolean {
    return !!this.expandedReviewIds()[id];
  }

  protected toggleReviewExpand(id: string): void {
    this.expandedReviewIds.update((m) => ({ ...m, [id]: !m[id] }));
  }

  /**
   * Heuristic for whether copy likely exceeds ~2 lines at typical column width.
   * Long messages get CSS line-clamp + “See more”; short ones stay unclamped without a button.
   */
  protected reviewMessageNeedsSeeMore(message: string | undefined): boolean {
    const t = message?.trim() ?? '';
    if (t.length < 48) return false;
    return t.length > 108 || t.split(/\s+/).filter(Boolean).length > 20;
  }

  protected voteOnReview(r: EventReviewItem, value: ReviewVoteValue): void {
    const eventId = this.event()?._id;
    if (!eventId) return;
    if (!this.auth.isLoggedIn()) {
      this.toast.showError('Please login or register to like/dislike reviews.');
      return;
    }
    if (this.isOwnReview(r)) {
      this.toast.showError('You cannot like or dislike your own review.');
      return;
    }
    if (this.voteBusy()[r._id]) return;
    this.voteBusy.update((m) => ({ ...m, [r._id]: true }));
    this.reviewsApi
      .voteReview(eventId, r._id, value)
      .pipe(
        finalize(() => {
          this.voteBusy.update((m) => {
            const next = { ...m };
            delete next[r._id];
            return next;
          });
        }),
      )
      .subscribe({
        next: (res) => {
          const d = res.data;
          if (!d) return;
          this.reviews.update((list) =>
            list.map((row) =>
              row._id === r._id
                ? {
                    ...row,
                    helpfulUp: d.helpfulUp,
                    helpfulDown: d.helpfulDown,
                    userVote: d.userVote,
                  }
                : row,
            ),
          );
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(typeof msg === 'string' ? msg : 'Could not record your vote.');
        },
      });
  }

  protected startEditReview(r: EventReviewItem): void {
    if (!this.isOwnReview(r) || this.reviewActionBusy()[r._id]) return;
    this.editingReviewId.set(r._id);
    this.editRating.set(Math.max(1, Math.min(5, Number(r.rating) || 1)));
    this.editMessage.set(r.message ?? '');
  }

  protected cancelEditReview(): void {
    this.editingReviewId.set(null);
    this.editRating.set(0);
    this.editMessage.set('');
  }

  protected setEditRating(n: number): void {
    this.editRating.set(n);
  }

  protected saveEditedReview(r: EventReviewItem): void {
    const eventId = this.event()?._id;
    if (!eventId || !this.isOwnReview(r)) return;
    const rating = this.editRating();
    if (rating < 1 || rating > 5) {
      this.toast.showError('Please choose a rating from 1 to 5 hearts.');
      return;
    }
    this.reviewActionBusy.update((m) => ({ ...m, [r._id]: true }));
    this.reviewsApi
      .updateReview(eventId, r._id, { rating, message: this.editMessage().trim() })
      .pipe(
        finalize(() => {
          this.reviewActionBusy.update((m) => {
            const next = { ...m };
            delete next[r._id];
            return next;
          });
        }),
      )
      .subscribe({
        next: (res) => {
          const updated = res.data;
          this.reviews.update((list) =>
            list.map((row) => (row._id === r._id ? { ...row, ...updated } : row)),
          );
          this.reviewSummary.set(this.buildReviewSummaryFromReviews(this.reviews()));
          this.cancelEditReview();
          this.toast.showSuccess(res.message ?? 'Review updated.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(typeof msg === 'string' ? msg : 'Could not update your review.');
        },
      });
  }

  protected deleteOwnReview(r: EventReviewItem): void {
    if (!this.isOwnReview(r) || this.reviewActionBusy()[r._id]) return;
    this.pendingDeleteReview.set(r);
  }

  protected closeDeleteReviewModal(): void {
    const pending = this.pendingDeleteReview();
    if (pending && this.reviewActionBusy()[pending._id]) return;
    this.pendingDeleteReview.set(null);
  }

  protected confirmDeleteReview(): void {
    const pending = this.pendingDeleteReview();
    if (!pending) return;
    this.executeDeleteOwnReview(pending);
  }

  private executeDeleteOwnReview(r: EventReviewItem): void {
    const eventId = this.event()?._id;
    if (!eventId || !this.isOwnReview(r) || this.reviewActionBusy()[r._id]) return;

    this.reviewActionBusy.update((m) => ({ ...m, [r._id]: true }));
    this.reviewsApi
      .deleteReview(eventId, r._id)
      .pipe(
        finalize(() => {
          this.reviewActionBusy.update((m) => {
            const next = { ...m };
            delete next[r._id];
            return next;
          });
        }),
      )
      .subscribe({
        next: (res) => {
          this.reviews.update((list) => list.filter((row) => row._id !== r._id));
          this.reviewSummary.set(this.buildReviewSummaryFromReviews(this.reviews()));
          this.hasReviewed.set(false);
          this.canReview.set(true);
          this.reviewBlockReason.set(null);
          this.ownReviewId.set(null);
          if (this.editingReviewId() === r._id) {
            this.cancelEditReview();
          }
          this.pendingDeleteReview.set(null);
          this.toast.showSuccess(res.message ?? 'Review deleted.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(typeof msg === 'string' ? msg : 'Could not delete your review.');
        },
      });
  }

  protected submitReview(): void {
    const ev = this.event();
    const id = ev?._id;
    const rating = this.draftRating();
    if (!id || rating < 1 || rating > 5) {
      this.toast.showError('Please choose a rating from 1 to 5 hearts.');
      return;
    }
    this.reviewSubmitting.set(true);
    this.reviewsApi
      .createReview(id, { rating, message: this.draftMessage().trim() })
      .pipe(finalize(() => this.reviewSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          const row = res.data;
          this.reviews.update((list) => [
            {
              _id: row._id,
              authorId: row.authorId,
              rating: row.rating,
              message: row.message ?? '',
              createdAt: row.createdAt ?? new Date().toISOString(),
              authorName: row.authorName ?? 'You',
              authorPictureUrl: row.authorPictureUrl,
              helpfulUp: row.helpfulUp ?? 0,
              helpfulDown: row.helpfulDown ?? 0,
              userVote: row.userVote ?? null,
            },
            ...list,
          ]);
          this.reviewSummary.set(this.buildReviewSummaryFromReviews(this.reviews()));
          this.hasReviewed.set(true);
          this.canReview.set(false);
          this.ownReviewId.set(row._id ?? null);
          this.draftRating.set(0);
          this.draftMessage.set('');
          this.reviewBlockReason.set('ALREADY_REVIEWED');
          this.toast.showSuccess(res.message ?? 'Review submitted.');
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(typeof msg === 'string' ? msg : 'Could not submit review.');
        },
      });
  }

  protected submitBooking(): void {
    const ev = this.event();
    const id = ev?._id;
    if (ev && !this.canBook()) {
      this.toast.showError(this.bookingUnavailableMessage(ev));
      return;
    }
    if (!id || !this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    let qty = Math.floor(this.bookingQuantity());
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    const seats = this.seatsSnapshot(ev);
    if (seats && qty > seats.available) {
      this.toast.showError(`Only ${seats.available} seats available.`);
      return;
    }
    this.bookingSubmitting.set(true);
    this.bookings
      .createBooking({ eventId: id, quantity: qty })
      .pipe(finalize(() => this.bookingSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          this.toast.showSuccess(res.message ?? 'Booking created.');
          this.event.update((current) => {
            if (!current) {
              return current;
            }
            const nextAvailable =
              typeof current.availableSeats === 'number'
                ? Math.max(0, current.availableSeats - qty)
                : current.availableSeats;
            return {
              ...current,
              availableSeats: nextAvailable,
            };
          });
          this.bookingQuantity.set(1);
          if (data?._id) {
            this.activeBookingId.set(data._id);
          }
          if (data && data.totalPrice > 0 && data.status === 'pending') {
            void this.router.navigate(['/checkout'], { queryParams: { bookingId: data._id } });
            return;
          }
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.toast.showError(typeof msg === 'string' ? msg : 'Booking failed.');
        },
      });
  }

  private loadEvent(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.eventService
      .getEvent(id)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorMessage.set(
            err.status === 404 ? 'Event not found.' : 'Unable to load this event.',
          );
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => {
        if (!res?.data) {
          if (!this.errorMessage()) this.errorMessage.set('Event not found.');
          return;
        }
        this.event.set(res.data);
        this.bookingQuantity.set(1);
        this.loadSecondary(id);
      });
  }

  private loadSecondary(eventId: string): void {
    this.reviewsApi.getReviews(eventId).subscribe({
      next: (r) => {
        const reviews = r.data?.reviews ?? [];
        this.reviews.set(reviews);
        this.reviewSummary.set(r.data?.summary ?? this.buildReviewSummaryFromReviews(reviews));
      },
      error: () => {
        this.reviews.set([]);
        this.reviewSummary.set(this.buildReviewSummaryFromReviews([]));
      },
    });

    if (!this.auth.isLoggedIn()) {
      this.isFavorite.set(false);
      this.activeBookingId.set(null);
      this.canReview.set(false);
      this.hasReviewed.set(false);
      this.reviewBlockReason.set('NOT_AUTHENTICATED');
      this.ownReviewId.set(null);
      return;
    }

    forkJoin({
      fav: this.favorites
        .getFavoriteStatus(eventId)
        .pipe(catchError(() => of({ data: { isFavorite: false } }))),
      activeBooking: this.bookings
        .getActiveBookingForEvent(eventId)
        .pipe(catchError(() => of({ success: true, data: null }))),
      status: this.reviewsApi.getReviewStatus(eventId).pipe(
        catchError(() =>
          of({
            success: true,
            data: {
              authenticated: true,
              canReview: false,
              hasReviewed: false,
              reason: null,
              existingReview: null,
            },
          }),
        ),
      ),
    }).subscribe(({ fav, activeBooking, status }) => {
      this.isFavorite.set(!!fav.data?.isFavorite);
      this.activeBookingId.set(activeBooking.data?._id ?? null);
      const d = status.data;
      this.canReview.set(!!d?.canReview);
      this.hasReviewed.set(!!d?.hasReviewed);
      this.reviewBlockReason.set(d?.reason ?? null);
      this.ownReviewId.set(d?.existingReview?._id ?? null);
    });
  }

  protected reviewHint(): string {
    if (this.hasReviewed()) return 'You have already shared a review for this event.';
    if (!this.auth.isLoggedIn()) return 'Log in or register to interact with reviews.';
    const r = this.reviewBlockReason();
    switch (r) {
      case 'NO_CONFIRMED_BOOKING':
        return 'Reviews unlock once your booking is confirmed.';
      case 'EVENT_CANCELLED':
        return 'This event was cancelled — reviews are closed.';
      case 'NOT_AUTHENTICATED':
        return 'Log in to book and to leave a review when eligible.';
      case 'ALREADY_REVIEWED':
        return 'You have already shared a review for this event.';
      default:
        return '';
    }
  }

  protected onBookingQtyChange(raw: string | number): void {
    if (raw === '' || raw === null || raw === undefined) {
      this.bookingQuantity.set(1);
      return;
    }
    const n = typeof raw === 'number' ? raw : Number(raw);
    const q = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
    this.bookingQuantity.set(q);
  }

  private isEventDatePassed(ev: EventApiItem): boolean {
    const rawDate = ev.date?.trim();
    if (!rawDate) {
      return false;
    }
    const eventDate = new Date(rawDate);
    if (Number.isNaN(eventDate.getTime())) {
      return false;
    }
    return eventDate.getTime() <= Date.now();
  }

  private buildReviewSummaryFromReviews(reviews: EventReviewItem[]): {
    averageRating: number;
    totalReviews: number;
    distribution: Array<{ level: number; count: number; pct: number }>;
  } {
    const totalReviews = reviews.length;
    const countsByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    for (const review of reviews) {
      const rating = Number(review.rating);
      if (rating >= 1 && rating <= 5) {
        countsByLevel[rating] = (countsByLevel[rating] || 0) + 1;
        totalRating += rating;
      }
    }
    const averageRating = totalReviews ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;
    const distribution = [5, 4, 3, 2, 1].map((level) => {
      const count = countsByLevel[level] || 0;
      const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
      return { level, count, pct };
    });
    return { averageRating, totalReviews, distribution };
  }
}
