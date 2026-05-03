import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EventApiItem, EventService } from '../../services/event.service';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-event-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SectionLoader],
  templateUrl: './dashboard-event-detail.page.html',
  styleUrl: './dashboard-event-detail.page.scss'
})
export class DashboardEventDetailPage implements OnInit {
  private static readonly IMAGE_FALLBACK = '/images/event-placeholder.svg';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  protected readonly event = signal<EventApiItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id?.trim()) {
      this.loading.set(false);
      this.errorMessage.set('Missing event id.');
      return;
    }

    this.eventService
      .getEvent(id.trim())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.event.set(res.data);
          } else {
            this.errorMessage.set('Event not found.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            err.status === 404 ? 'Event not found.' : 'Unable to load this event.'
          );
        }
      });
  }

  protected coverImageSrc(e: EventApiItem): string {
    const raw = e.image?.trim();
    return raw || DashboardEventDetailPage.IMAGE_FALLBACK;
  }

  protected creatorLabel(e: EventApiItem): string | null {
    const c = e.createdBy;
    if (c && typeof c === 'object' && 'name' in c && c.name) {
      return c.name;
    }
    return null;
  }

  protected goToCatalog(): void {
    void this.router.navigate(['/dashboard/events']);
  }
}
