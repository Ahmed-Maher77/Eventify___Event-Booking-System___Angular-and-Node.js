import { AfterViewInit, Component, HostListener, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button/button';
import Typed, { type TypedOptions } from 'typed.js';
import { TypingPreset } from './landing-section.model';
import { setupLandingSectionAnimations } from './landing-section.animations';

@Component({
  selector: 'app-landing-section',
  imports: [RouterLink, Button],
  templateUrl: './landing-section.html',
  styleUrl: './landing-section.scss',
})
export class LandingSection implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('landingHeroRoot', { static: true }) private landingHeroRoot!: ElementRef<HTMLElement>;
  @ViewChild('typedHeadline', { static: true }) private typedHeadlineRef!: ElementRef<HTMLElement>;
  private typedInstance: Typed | null = null;
  private landingContext: ReturnType<typeof setupLandingSectionAnimations> | null = null;
  protected searchPlaceholder = 'Search events, cities, or categories...';

  // Change this value to switch animation style quickly.
  private readonly activePreset: TypingPreset = 'ai_stream';

  private readonly headlineStatements = [
    'Discover Amazing Events Near You',
    'Find Concerts, Workshops & More',
    'Book Seats for Trending Events',
    'Explore Experiences Curated for You'
  ];

  private readonly typingPresets: Record<TypingPreset, Partial<TypedOptions>> = {
    ai_stream: {
      typeSpeed: 34,
      backSpeed: 0,
      backDelay: 1700,
      smartBackspace: true,
      fadeOut: true,
      fadeOutClass: 'typed-fade-out',
      fadeOutDelay: 180,
      showCursor: true,
      cursorChar: '|'
    },
    smooth_fade: {
      typeSpeed: 44,
      backSpeed: 0,
      backDelay: 1900,
      smartBackspace: true,
      fadeOut: true,
      fadeOutClass: 'typed-fade-out',
      fadeOutDelay: 260,
      showCursor: true,
      cursorChar: '|'
    },
    classic_typewriter: {
      typeSpeed: 52,
      backSpeed: 30,
      backDelay: 1400,
      smartBackspace: true,
      fadeOut: false,
      showCursor: true,
      cursorChar: '|'
    },
    fast_pitch: {
      typeSpeed: 65,
      backSpeed: 36,
      backDelay: 900,
      smartBackspace: true,
      fadeOut: false,
      showCursor: true,
      cursorChar: '|'
    }
  };

  ngOnInit(): void {
    this.updateSearchPlaceholder();
  }

  ngAfterViewInit(): void {
    this.typedInstance = new Typed(this.typedHeadlineRef.nativeElement, {
      strings: this.headlineStatements,
      ...this.typingPresets[this.activePreset],
      loop: true,
    });

    this.landingContext = setupLandingSectionAnimations(this.landingHeroRoot.nativeElement);
  }

  ngOnDestroy(): void {
    this.typedInstance?.destroy();
    this.typedInstance = null;
    this.landingContext?.revert();
    this.landingContext = null;
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateSearchPlaceholder();
  }

  private updateSearchPlaceholder(): void {
    this.searchPlaceholder =
      window.innerWidth < 500 ? 'Search events, cities...' : 'Search events, cities, or categories...';
  }
}
