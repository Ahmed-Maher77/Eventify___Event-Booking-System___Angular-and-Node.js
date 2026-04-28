import { EventApiItem } from '../../services/event.service';
import { FeaturedEventCardData } from './featured-event-card.model';

function toDisplayCategory(rawCategory: string): string {
  const normalized = rawCategory.trim().toLowerCase();
  const knownCategories: Record<string, string> = {
    concert: 'Concert',
    conference: 'Conference',
    workshop: 'Workshop',
    seminar: 'Seminar',
    sports: 'Sports',
  };

  return knownCategories[normalized] ?? 'Other';
}

function formatEventDate(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${datePart} • ${timePart}`;
}

export function mapEventApiItemToFeaturedCard(event: EventApiItem): FeaturedEventCardData {
  return {
    id: event._id,
    title: event.title,
    category: toDisplayCategory(event.category),
    dateText: formatEventDate(event.date),
    location: event.location,
    priceFrom: `$${Number(event.price).toFixed(2)}`,
    imageUrl: event.image || '/images/event-placeholder.svg',
  };
}
