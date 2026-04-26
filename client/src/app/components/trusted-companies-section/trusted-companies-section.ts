import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-trusted-companies-section',
  imports: [],
  templateUrl: './trusted-companies-section.html',
  styleUrl: './trusted-companies-section.scss',
})
export class TrustedCompaniesSection implements AfterViewInit, OnDestroy {
  @ViewChild('marqueeTrack', { static: true }) private marqueeTrackRef!: ElementRef<HTMLElement>;
  private marqueeTween: gsap.core.Tween | null = null;

  protected readonly logos = [
    { src: 'images/companies-logos/amazon-logo.png', alt: 'Amazon' },
    { src: 'images/companies-logos/google-logo.jpg', alt: 'Google' },
    { src: 'images/companies-logos/ibm-logo.png', alt: 'IBM' },
    { src: 'images/companies-logos/fedex-logo.png', alt: 'FedEx' },
    { src: 'images/companies-logos/mastercard-logo-1.png', alt: 'Mastercard' },
    { src: 'images/companies-logos/logo-chanel.png', alt: 'Chanel' },
    { src: 'images/companies-logos/marvel-logo.png', alt: 'Marvel' },
    { src: 'images/companies-logos/vans-logo.jpg', alt: 'Vans' }
  ] as const;

  ngAfterViewInit(): void {
    this.marqueeTween = gsap.to(this.marqueeTrackRef.nativeElement, {
      xPercent: -50,
      duration: 26,
      ease: 'none',
      repeat: -1
    });
  }

  ngOnDestroy(): void {
    this.marqueeTween?.kill();
    this.marqueeTween = null;
  }

  protected pauseAnimation(): void {
    this.marqueeTween?.pause();
  }

  protected resumeAnimation(): void {
    this.marqueeTween?.play();
  }
}
