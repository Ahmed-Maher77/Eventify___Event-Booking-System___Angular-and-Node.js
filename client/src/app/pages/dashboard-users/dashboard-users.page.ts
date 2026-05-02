import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard-users-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './dashboard-users.page.html',
  styleUrl: './dashboard-users.page.scss',
})
export class DashboardUsersPage {
  protected readonly isLoading = signal(false);
}
