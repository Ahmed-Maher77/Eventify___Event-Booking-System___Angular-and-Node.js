import { EventApiItem } from '../../services/event.service';
import { FeaturedEventCardData } from './featured-event-card.model';

function toDisplayCategory(rawCategory: string | null | undefined): string {
  const normalized = (rawCategory ?? '').trim().toLowerCase();
  const knownCategories: Record<string, string> = {
    concert: 'Concert',
    conference: 'Conference',
    workshop: 'Workshop',
    seminar: 'Seminar',
    sports: 'Sports',
  };

  return normalized ? knownCategories[normalized] ?? 'Other' : 'Other';
}

function formatEventDate(dateIso: string | null | undefined): string {
  if (!dateIso) {
    return 'Date not specified';
  }

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
  const numericPrice = Number(event?.price);

  return {
    id: event?._id || crypto.randomUUID(),
    title: event?.title?.trim() || 'Untitled Event',
    category: toDisplayCategory(event?.category),
    dateText: formatEventDate(event?.date),
    location: event?.location?.trim() || 'Location not specified',
    priceFrom: `$${Number.isFinite(numericPrice) ? numericPrice.toFixed(2) : '0.00'}`,
    imageUrl: event.image || '/images/event-placeholder.svg',
  };
}
