import { Component, Input } from '@angular/core';

export interface PolicyInfoCardItem {
  iconClass: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-policy-info-cards',
  standalone: true,
  templateUrl: './policy-info-cards.html',
  styleUrl: './policy-info-cards.scss'
})
export class PolicyInfoCardsComponent {
  @Input({ required: true }) sectionTitle!: string;
  @Input({ required: true }) cards!: readonly PolicyInfoCardItem[];
}
