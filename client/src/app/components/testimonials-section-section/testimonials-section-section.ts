import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

@Component({
  selector: 'app-testimonials-section-section',
  imports: [CommonModule],
  templateUrl: './testimonials-section-section.html',
  styleUrl: './testimonials-section-section.scss',
})
export class TestimonialsSectionSection {
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;

  protected readonly testimonials: TestimonialItem[] = [
    {
      name: 'Sarah Ahmed',
      role: 'Product Designer',
      quote:
        'I found great events in seconds and booking was super smooth. The seat selection flow is clear, and my confirmation arrived instantly.',
      avatar: 'https://www.figma.com/api/mcp/asset/7a4bf30c-ecec-4db8-b53c-0c27bd8a88cb'
    },
    {
      name: 'Omar Khaled',
      role: 'Software Engineer',
      quote:
        'Eventify made planning our weekend effortless. Discovering events and booking tickets took just a few taps.',
      avatar: 'https://www.figma.com/api/mcp/asset/7a4bf30c-ecec-4db8-b53c-0c27bd8a88cb'
    },
    {
      name: 'Mariam Youssef',
      role: 'Marketing Specialist',
      quote:
        'The platform is fast, clean, and reliable. I always get confirmations instantly and never miss an event now.',
      avatar: 'https://www.figma.com/api/mcp/asset/7a4bf30c-ecec-4db8-b53c-0c27bd8a88cb'
    }
  ];

  protected activeIndex = 0;

  protected get activeTestimonial(): TestimonialItem {
    return this.testimonials[this.activeIndex];
  }

  protected previous(): void {
    const last = this.testimonials.length - 1;
    this.activeIndex = this.activeIndex === 0 ? last : this.activeIndex - 1;
  }

  protected next(): void {
    const last = this.testimonials.length - 1;
    this.activeIndex = this.activeIndex === last ? 0 : this.activeIndex + 1;
  }
}
