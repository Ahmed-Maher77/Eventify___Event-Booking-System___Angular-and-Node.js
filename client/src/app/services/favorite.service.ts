import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  FavoriteMutationResponse,
  FavoritesResponse,
  FavoriteStatusResponse,
} from './favorite.types';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly favoritesApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/favorites`;
  private favoritesCache$: Observable<FavoritesResponse> | null = null;
  private favoritesCacheExpiresAt = 0;
  private readonly totalFavoritesSubject = new BehaviorSubject<number>(0);
  private static readonly FAVORITES_CACHE_TTL_MS = 120000;
  readonly totalFavorites$ = this.totalFavoritesSubject.asObservable();

  getFavorites(): Observable<FavoritesResponse> {
    const now = Date.now();
    if (this.favoritesCache$ && now < this.favoritesCacheExpiresAt) {
      return this.favoritesCache$;
    }
    this.favoritesCacheExpiresAt = now + FavoriteService.FAVORITES_CACHE_TTL_MS;
    this.favoritesCache$ = this.http
      .get<FavoritesResponse>(this.favoritesApiUrl, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.totalFavoritesSubject.next(response.data?.totalFavorites ?? 0);
        }),
        // Reuse a single in-flight/finished request for a short TTL to avoid burst 429s.
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.favoritesCache$;
  }

  getFavoriteStatus(eventId: string): Observable<FavoriteStatusResponse> {
    return this.http.get<FavoriteStatusResponse>(`${this.favoritesApiUrl}/${eventId}/status`, {
      withCredentials: true,
    });
  }

  addFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http
      .post<FavoriteMutationResponse>(
        `${this.favoritesApiUrl}/${eventId}`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.totalFavoritesSubject.next(response.data?.totalFavorites ?? 0);
          this.invalidateFavoritesCache();
        }),
      );
  }

  removeFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http
      .delete<FavoriteMutationResponse>(`${this.favoritesApiUrl}/${eventId}`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.totalFavoritesSubject.next(response.data?.totalFavorites ?? 0);
          this.invalidateFavoritesCache();
        }),
      );
  }

  toggleFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http
      .patch<FavoriteMutationResponse>(
        `${this.favoritesApiUrl}/${eventId}/toggle`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.totalFavoritesSubject.next(response.data?.totalFavorites ?? 0);
          this.invalidateFavoritesCache();
        }),
      );
  }

  private invalidateFavoritesCache(): void {
    this.favoritesCache$ = null;
    this.favoritesCacheExpiresAt = 0;
  }
}
