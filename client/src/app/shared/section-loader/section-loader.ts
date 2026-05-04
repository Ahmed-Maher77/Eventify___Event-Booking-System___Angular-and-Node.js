import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-loader',
  standalone: true,
  imports: [],
  templateUrl: './section-loader.html',
  styleUrl: './section-loader.scss',
})
export class SectionLoader {
  readonly label = input('Loading');
  readonly text = input('Loading...');
  readonly size = input(30);
}
