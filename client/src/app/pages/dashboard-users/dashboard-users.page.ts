import { Component } from '@angular/core';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';

@Component({
  selector: 'app-dashboard-users-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent],
  templateUrl: './dashboard-users.page.html',
  styleUrl: './dashboard-users.page.scss'
})
export class DashboardUsersPage {}
