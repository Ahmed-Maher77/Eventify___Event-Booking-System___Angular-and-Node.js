import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subject, catchError, finalize, of, takeUntil, timeout } from 'rxjs';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FeaturedEventCard } from '../../components/featured-event-card/featured-event-card';
import { mapEventApiItemToFeaturedCard } from '../../components/featured-event-card/featured-event-card.mapper';
import { FeaturedEventCardData } from '../../components/featured-event-card/featured-event-card.model';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FeaturedEventCard, HighlightedPageHeadingComponent],
  templateUrl: './favorites.page.html',
  styleUrls: ['../../../sass/components/static-info-page.scss', './favorites.page.scss']
})
export class FavoritesPage implements OnInit, OnDestroy {
  private readonly favoriteService = inject(FavoriteService);
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  protected favoriteEvents: FeaturedEventCardData[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  ngOnInit(): void {
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onFavoriteToggled(eventId: string): void {
    this.favoriteService
      .toggleFavorite(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const isFavorite = response.data?.isFavorite ?? false;
          if (!isFavorite) {
            this.favoriteEvents = this.favoriteEvents.filter((event) => event.id !== eventId);
          }
        }
      });
  }

  protected retryLoad(): void {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.favoriteService
      .getFavorites()
      .pipe(
        timeout(12000),
        takeUntil(this.destroy$),
        catchError((error: unknown) => {
          this.ngZone.run(() => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.errorMessage = 'Your session expired. Please log in again to view favorites.';
            } else {
              this.errorMessage = 'Unable to load favorites right now. Please try again.';
            }
          });
          return of({ data: { favorites: [], totalFavorites: 0 } });
        }),
        finalize(() => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (response) => {
          const favorites = response.data?.favorites ?? [];
          this.favoriteEvents = favorites.map((event) => ({
            ...mapEventApiItemToFeaturedCard(event),
            isFavorite: true
          }));
        }
      });
  }
}
