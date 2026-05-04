import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventApiItem } from './event.service';

interface FavoriteMutationResponse {
  data: {
    eventId: string;
    isFavorite: boolean;
    totalFavorites: number;
  };
}

interface FavoritesResponse {
  data: {
    favorites: EventApiItem[];
    totalFavorites: number;
  };
}

interface FavoriteStatusResponse {
  data: {
    eventId: string;
    isFavorite: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly favoritesApiUrl = `${environment.backendApiUrl.trim().replace(/\/+$/, '')}/favorites`;

  getFavorites(): Observable<FavoritesResponse> {
    return this.http.get<FavoritesResponse>(this.favoritesApiUrl, { withCredentials: true });
  }

  getFavoriteStatus(eventId: string): Observable<FavoriteStatusResponse> {
    return this.http.get<FavoriteStatusResponse>(`${this.favoritesApiUrl}/${eventId}/status`, {
      withCredentials: true,
    });
  }

  addFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http.post<FavoriteMutationResponse>(`${this.favoritesApiUrl}/${eventId}`, {}, { withCredentials: true });
  }

  removeFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http.delete<FavoriteMutationResponse>(`${this.favoritesApiUrl}/${eventId}`, { withCredentials: true });
  }

  toggleFavorite(eventId: string): Observable<FavoriteMutationResponse> {
    return this.http.patch<FavoriteMutationResponse>(
      `${this.favoritesApiUrl}/${eventId}/toggle`,
      {},
      { withCredentials: true }
    );
  }
}
