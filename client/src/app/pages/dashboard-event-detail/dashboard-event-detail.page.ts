import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EventApiItem, EventService } from '../../services/event.service';
import { AdminEventFormModalComponent } from '../../shared/admin-event-form-modal/admin-event-form-modal.component';
import { Button } from '../../shared/button/button';
import { SectionLoader } from '../../shared/section-loader/section-loader';

@Component({
  selector: 'app-dashboard-event-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SectionLoader, Button, AdminEventFormModalComponent],
  templateUrl: './dashboard-event-detail.page.html',
  styleUrl: './dashboard-event-detail.page.scss'
})
export class DashboardEventDetailPage implements OnInit {
  private static readonly IMAGE_FALLBACK = '/images/event-placeholder.svg';

  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

  protected readonly event = signal<EventApiItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly eventEditModalOpen = signal(false);

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

  protected openEventEditModal(): void {
    if (!this.event()?._id) {
      return;
    }
    this.eventEditModalOpen.set(true);
  }

  protected closeEventEditModal(): void {
    this.eventEditModalOpen.set(false);
  }

  protected onEventEditSaved(): void {
    const id = this.route.snapshot.paramMap.get('id')?.trim();
    if (id) {
      this.eventService.getEvent(id).subscribe({
        next: (res) => {
          if (res?.data) {
            this.event.set(res.data);
          }
        },
      });
    }
    this.eventEditModalOpen.set(false);
  }

  protected seatsSnapshot(e: EventApiItem): { available: number; capacity: number } | null {
    if (e.capacity == null || e.availableSeats == null) {
      return null;
    }
    const capacity = Number(e.capacity);
    const available = Number(e.availableSeats);
    if (!Number.isFinite(capacity) || capacity < 1 || !Number.isFinite(available) || available < 0) {
      return null;
    }
    return { available, capacity };
  }
}
