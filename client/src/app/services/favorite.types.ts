import { EventApiItem } from './event.service';

export interface FavoriteMutationResponse {
  data: {
    eventId: string;
    isFavorite: boolean;
    totalFavorites: number;
  };
}

export interface FavoritesResponse {
  data: {
    favorites: EventApiItem[];
    totalFavorites: number;
  };
}

export interface FavoriteStatusResponse {
  data: {
    eventId: string;
    isFavorite: boolean;
  };
}
