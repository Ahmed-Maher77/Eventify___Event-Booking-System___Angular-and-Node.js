import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss'
})
export class SectionHeadingComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() align: 'left' | 'center' = 'center';
}
