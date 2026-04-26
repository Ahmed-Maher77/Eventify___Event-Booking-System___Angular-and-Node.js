import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeadingComponent } from '../../shared/section-heading/section-heading';
import { HowItWorksStep } from './how-it-works-section.model';

@Component({
  selector: 'app-how-it-works-section',
  imports: [CommonModule, SectionHeadingComponent],
  templateUrl: './how-it-works-section.html',
  styleUrl: './how-it-works-section.scss',
})
export class HowItWorksSection {
  protected readonly steps: HowItWorksStep[] = [
    {
      title: 'Find Event',
      description: 'Explore upcoming events by category, date, or location.',
      iconClass: 'fa-solid fa-magnifying-glass'
    },
    {
      title: 'Select Seats',
      description: 'Choose your preferred seats and ticket quantity.',
      iconClass: 'fa-solid fa-users'
    },
    {
      title: 'Confirm Booking',
      description: 'Review your details and confirm your reservation.',
      iconClass: 'fa-regular fa-circle-check'
    },
    {
      title: 'Receive Confirmation',
      description: 'Get instant booking confirmation and event details.',
      iconClass: 'fa-regular fa-envelope-open'
    },
    {
      title: 'Pay securely',
      description: 'Secure online payment',
      iconClass: 'fa-solid fa-shield-halved'
    }
  ];
}
