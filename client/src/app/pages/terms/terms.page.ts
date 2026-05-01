import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { setupStaticInfoPageAnimations } from '../static-info-page.animations';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './terms.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class TermsPage implements AfterViewInit, OnDestroy {
  @ViewChild('termsPageRoot') private termsPageRoot?: ElementRef<HTMLElement>;
  private termsContext: ReturnType<typeof setupStaticInfoPageAnimations> | null = null;

  ngAfterViewInit(): void {
    this.termsContext = setupStaticInfoPageAnimations(this.termsPageRoot?.nativeElement);
  }

  ngOnDestroy(): void {
    this.termsContext?.revert();
    this.termsContext = null;
  }
}
