import { EventSortField, EventSortOrder } from '../../services/event.service';

export type EventCategoryTab =
  | 'all'
  | 'concert'
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'sports'
  | 'other';

export type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right';

export interface EventsQueryState {
  name: string;
  categories: EventCategoryTab[];
  location: string;
  minPrice: number;
  maxPrice: number;
  sort: EventSortField;
  order: EventSortOrder;
  page: number;
  limit: number;
}
