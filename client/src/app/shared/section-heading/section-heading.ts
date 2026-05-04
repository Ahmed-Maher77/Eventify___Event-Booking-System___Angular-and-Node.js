import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import { setupSectionHeadingAnimations } from './section-heading.animations';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss'
})
export class SectionHeadingComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private headingContext: ReturnType<typeof setupSectionHeadingAnimations> | null = null;

  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() align: 'left' | 'center' = 'center';

  ngAfterViewInit(): void {
    this.headingContext = setupSectionHeadingAnimations(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.headingContext?.revert();
    this.headingContext = null;
  }
}
