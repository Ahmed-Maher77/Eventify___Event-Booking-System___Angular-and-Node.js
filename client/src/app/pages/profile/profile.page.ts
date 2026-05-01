import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './profile.page.html',
  styleUrl: '../../../sass/components/static-info-page.scss'
})
export class ProfilePage {}
