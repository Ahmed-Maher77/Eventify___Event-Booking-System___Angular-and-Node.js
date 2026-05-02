import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {
  readonly label = input('Loading');
  readonly text = input('Loading...');
  readonly size = input(30);
}
