import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-users-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, SectionLoader],
  templateUrl: './dashboard-users.page.html',
  styleUrl: './dashboard-users.page.scss',
})
export class DashboardUsersPage {
  protected readonly isLoading = signal(false);
}
