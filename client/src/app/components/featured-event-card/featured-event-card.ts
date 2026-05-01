import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() showFavoriteAction = false;
  @Output() favoriteToggled = new EventEmitter<string>();

  protected onFavoriteClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggled.emit(this.event.id);
  }
}
