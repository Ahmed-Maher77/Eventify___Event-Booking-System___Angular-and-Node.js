import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';

register();

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TestimonialsSectionSection implements AfterViewInit, OnDestroy {
  @ViewChild('quoteSwiper') private quoteSwiper?: ElementRef<SwiperContainer>;
  protected readonly ratingStars = [1, 2, 3, 4, 5] as const;

  protected readonly testimonials: TestimonialItem[] = [
    {
      name: 'Sarah Ahmed',
      role: 'Product Designer',
      quote:
        'I found great events in seconds and booking was super smooth. The seat selection flow is clear, and my confirmation arrived instantly.',
      avatar: '/images/users/sarah-picture.png'
    },
    {
      name: 'Omar Khaled',
      role: 'Software Engineer',
      quote:
        'Eventify made planning our weekend effortless. Discovering events and booking tickets took just a few taps.',
      avatar: '/images/users/omar-picture.jpg'
    },
    {
      name: 'Mariam Youssef',
      role: 'Marketing Specialist',
      quote:
        'The platform is fast, clean, and reliable. I always get confirmations instantly and never miss an event now.',
      avatar: '/images/users/mariam-picture.jpg'
    }
  ];

  protected activeIndex = 0;

  protected get activeTestimonial(): TestimonialItem {
    return this.testimonials[this.activeIndex];
  }

  protected previous(): void {
    const last = this.testimonials.length - 1;
    this.activeIndex = this.activeIndex === 0 ? last : this.activeIndex - 1;
    this.quoteSwiper?.nativeElement.swiper?.slidePrev(420);
  }

  protected next(): void {
    const last = this.testimonials.length - 1;
    this.activeIndex = this.activeIndex === last ? 0 : this.activeIndex + 1;
    this.quoteSwiper?.nativeElement.swiper?.slideNext(420);
  }

  ngAfterViewInit(): void {
    const swiperElement = this.quoteSwiper?.nativeElement;
    if (!swiperElement) {
      return;
    }

    Object.assign(swiperElement, {
      slidesPerView: 1,
      loop: true,
      speed: 420,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoHeight: false,
      watchOverflow: true,
      allowTouchMove: true
    });

    swiperElement.initialize();
    swiperElement.addEventListener('swiperslidechange', this.handleSlideChange);
  }

  ngOnDestroy(): void {
    this.quoteSwiper?.nativeElement.removeEventListener('swiperslidechange', this.handleSlideChange);
  }

  private readonly handleSlideChange = () => {
    const swiper = this.quoteSwiper?.nativeElement.swiper;
    if (!swiper) {
      return;
    }

    this.activeIndex = swiper.realIndex;
  }
}
