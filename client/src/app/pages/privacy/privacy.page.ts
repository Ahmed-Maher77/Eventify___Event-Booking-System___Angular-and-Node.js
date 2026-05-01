import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './privacy.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class PrivacyPage implements AfterViewInit, OnDestroy {
  @ViewChild('privacyPageRoot') private privacyPageRoot?: ElementRef<HTMLElement>;
  private privacyContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;

  ngAfterViewInit(): void {
    this.privacyContext = setupStaticInfoPageAnimations(this.privacyPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.privacyContext?.revert();
    this.privacyContext = null;
  }
}
