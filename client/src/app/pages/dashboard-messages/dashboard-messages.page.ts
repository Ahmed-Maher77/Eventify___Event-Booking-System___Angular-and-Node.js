import { Component, signal } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { Loader } from '../../shared/loader/loader';

@Component({
  selector: 'app-dashboard-messages-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, Loader],
  templateUrl: './dashboard-messages.page.html',
  styleUrl: './dashboard-messages.page.scss',
})
export class DashboardMessagesPage {
  protected readonly isLoading = signal(false);
}
