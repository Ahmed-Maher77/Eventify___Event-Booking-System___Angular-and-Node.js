import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/button/button';
import { setupCallToActionAnimations } from './call-to-action-section.animations';

@Component({
  selector: 'app-call-to-action-section',
  imports: [RouterLink, Button],
  templateUrl: './call-to-action-section.html',
  styleUrl: './call-to-action-section.scss',
})
export class CallToActionSection implements AfterViewInit, OnDestroy {
  @ViewChild('ctaRoot') private ctaRoot?: ElementRef<HTMLElement>;
  private ctaContext: ReturnType<typeof setupCallToActionAnimations> | null = null;

  ngAfterViewInit(): void {
    this.ctaContext = setupCallToActionAnimations(this.ctaRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.ctaContext?.revert();
    this.ctaContext = null;
  }
}
