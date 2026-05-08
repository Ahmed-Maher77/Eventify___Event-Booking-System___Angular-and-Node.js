import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminDashboardService, AdminUserListItem } from '../../services/admin-dashboard.service';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { Button } from '../../shared/button/button';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HighlightedPageHeadingComponent, SectionLoader, Button],
  templateUrl: './admin-user-detail.page.html',
  styleUrl: './admin-user-detail.page.scss'
})
export class AdminUserDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminDashboardService);

  user: AdminUserListItem | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.fetchUserDetails(userId);
    } else {
      this.error = 'No user ID provided';
      this.loading = false;
    }
  }

  protected userInitials(user: AdminUserListItem): string {
    const parts = `${user.name ?? ''}`
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) {
      return 'U';
    }
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  }

  private fetchUserDetails(id: string): void {
    this.adminService.getUserById(id).subscribe({
      next: (response) => {
        this.user = response.data.user;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load user details';
        this.loading = false;
      }
    });
  }
}
