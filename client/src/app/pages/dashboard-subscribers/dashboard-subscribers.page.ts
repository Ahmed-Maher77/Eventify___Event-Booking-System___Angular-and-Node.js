import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard-subscribers-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './dashboard-subscribers.page.html',
  styleUrl: './dashboard-subscribers.page.scss',
})
export class DashboardSubscribersPage {
  protected readonly isLoading = signal(false);
}
