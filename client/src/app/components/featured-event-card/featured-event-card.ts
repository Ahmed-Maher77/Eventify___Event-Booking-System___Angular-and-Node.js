import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeaturedEventCardData } from './featured-event-card.model';

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
