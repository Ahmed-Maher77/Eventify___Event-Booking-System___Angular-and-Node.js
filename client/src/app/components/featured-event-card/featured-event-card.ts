import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface FeaturedEventCardData {
  id: string;
  title: string;
  category: string;
  dateText: string;
  location: string;
  priceFrom: string;
  imageUrl: string;
}

@Component({
  selector: 'app-featured-event-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './featured-event-card.html',
  styleUrl: './featured-event-card.scss'
})
export class FeaturedEventCard {
  @Input({ required: true }) event!: FeaturedEventCardData;
}
