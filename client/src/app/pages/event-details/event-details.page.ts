import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { EventReviewItem, EventReviewService } from '../../services/event-review.service';
import { EventApiItem, EventService } from '../../services/event.service';
import { FavoriteService } from '../../services/favorite.service';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../shared/button/button';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-event-details-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SectionLoader, Button],
  templateUrl: './event-details.page.html',
  styleUrl: './event-details.page.scss',
})
export class EventDetailsPage implements OnInit {
  private static readonly IMAGE_FALLBACK = '/images/event-placeholder.svg';

  /** Static rows for layout preview (not persisted). */
  private static readonly SAMPLE_REVIEWS: EventReviewItem[] = [
    {
      _id: 'sample-review-1',
      rating: 5,
      message: 'Incredible atmosphere and smooth check-in. Would absolutely book again.',
      createdAt: '2026-01-12T10:30:00.000Z',
      authorName: 'Jordan P.',
    },
    {
      _id: 'sample-review-2',
      rating: 4,
      message: 'Great value for the ticket price. Venue was easy to find.',
      createdAt: '2026-01-08T16:00:00.000Z',
      authorName: 'Samira K.',
    },
    {
      _id: 'sample-review-3',
      rating: 5,
      message: '',
      createdAt: '2026-01-03T09:15:00.000Z',
      authorName: 'Alex M.',
    },
  ];

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

  protected readonly reviews = signal<EventReviewItem[]>([]);
  protected readonly canReview = signal(false);
  protected readonly hasReviewed = signal(false);
  protected readonly reviewBlockReason = signal<string | null>(null);
  protected readonly reviewSubmitting = signal(false);
  protected readonly draftRating = signal(0);
  protected readonly draftMessage = signal('');

  protected readonly displayedReviews = computed(() => [
    ...EventDetailsPage.SAMPLE_REVIEWS,
    ...this.reviews(),
  ]);

  protected readonly avgRatingDisplay = computed(() => {
    const list = this.displayedReviews();
    if (!list.length) return null;
    const sum = list.reduce((a, r) => a + r.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  protected isSampleReview(r: EventReviewItem): boolean {
    return r._id.startsWith('sample-review-');
  }

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
    if (!Number.isFinite(capacity) || capacity < 1 || !Number.isFinite(available) || available < 0) {
      return null;
    }
    return { available, capacity };
  }

  protected canBook(): boolean {
    const ev = this.event();
    if (!ev || ev.status === 'cancelled' || ev.status === 'completed') return false;
    const seats = this.seatsSnapshot(ev);
    if (seats && seats.available < 1) return false;
    return this.auth.isLoggedIn();
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
              rating: row.rating,
              message: row.message ?? '',
              createdAt: row.createdAt,
              authorName: row.authorName ?? 'You',
            },
            ...list,
          ]);
          this.hasReviewed.set(true);
          this.canReview.set(false);
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
          const bookingId = res.data?._id;
          this.toast.showSuccess(res.message ?? 'Booking created.');
          if (bookingId) {
            void this.router.navigate(['/bookings', bookingId]);
          } else {
            void this.router.navigate(['/bookings']);
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
      next: (r) => this.reviews.set(r.data?.reviews ?? []),
      error: () => this.reviews.set([]),
    });

    if (!this.auth.isLoggedIn()) {
      this.isFavorite.set(false);
      this.canReview.set(false);
      this.hasReviewed.set(false);
      this.reviewBlockReason.set('NOT_AUTHENTICATED');
      return;
    }

    forkJoin({
      fav: this.favorites.getFavoriteStatus(eventId).pipe(catchError(() => of({ data: { isFavorite: false } }))),
      status: this.reviewsApi.getReviewStatus(eventId).pipe(
        catchError(() =>
          of({
            success: true,
            data: {
              authenticated: true,
              canReview: false,
              hasReviewed: false,
              reason: null,
            },
          }),
        ),
      ),
    }).subscribe(({ fav, status }) => {
        this.isFavorite.set(!!fav.data?.isFavorite);
        const d = status.data;
        this.canReview.set(!!d?.canReview);
        this.hasReviewed.set(!!d?.hasReviewed);
        this.reviewBlockReason.set(d?.reason ?? null);
      });
  }

  protected reviewHint(): string {
    if (this.hasReviewed()) return 'You have already shared a review for this event.';
    if (!this.auth.isLoggedIn()) return 'Log in to save favorites and book tickets.';
    const r = this.reviewBlockReason();
    switch (r) {
      case 'EVENT_NOT_ENDED':
        return 'Reviews open after the event date has passed.';
      case 'NO_CONFIRMED_BOOKING':
        return 'Reviews unlock once your booking is confirmed and the event date has passed.';
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

  protected heartsArray(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(n))) }, (_, i) => i);
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
}
