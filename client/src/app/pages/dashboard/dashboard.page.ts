import { Component, inject, signal, computed, viewChild, ElementRef, effect, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminRecentBookingsComponent,
  type AdminRecentBookingItemData
} from '../../shared/admin-recent-bookings/admin-recent-bookings';
import { HighlightedPageHeadingComponent } from '../../shared/highlighted-page-heading/highlighted-page-heading';
import { SectionLoader } from '../../shared/section-loader/section-loader';
import { AdminDashboardService, AdminDashboardStatsData, AdminDashboardStatsResponse, ChartData } from '../../services/admin-dashboard.service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { InsightsPeriod } from './dashboard.page.types';
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [HighlightedPageHeadingComponent, RouterLink, AdminRecentBookingsComponent, SectionLoader],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminDashboardService);
  protected readonly periodOptions: InsightsPeriod[] = [7, 30, 90];
  protected readonly selectedPeriod = signal<InsightsPeriod>(30);
  protected readonly isStatsLoading = signal(false);
  protected readonly isRecentBookingsLoading = signal(false);
  protected readonly isAttentionLoading = signal(false);
  protected readonly attentionLoadError = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly bookingChartRef = viewChild<ElementRef<HTMLCanvasElement>>('bookingChart');
  private chartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      const canvasRef = this.bookingChartRef();
      if (!canvasRef) {
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.chartInstance = null;
        }
        return;
      }

      if (!this.chartInstance) {
        this.initChart(canvasRef.nativeElement);
      } else {
        this.updateChart();
      }
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentBookings();
    this.loadNeedsAttention();
  }

  protected readonly adminDashboardStatsData = signal<AdminDashboardStatsData>({
    totalRevenue: 0,
    ticketsSold: 0,
    activeUsers: 0,
    activeEvents: 0,
    revenueChange: 0,
    ticketsChange: 0,
    activeUsersChange: 0,
    newEventsThisWeek: 0,
    chartData: []
  }
  )

  protected readonly formattedTotalRevenue = computed(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(this.adminDashboardStatsData().totalRevenue);
  });

  protected readonly formattedTicketsSold = computed(() => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(this.adminDashboardStatsData().ticketsSold);
  });

  private updateChart(): void {
    if (!this.chartInstance) return;

    this.chartInstance.data.labels = this.adminDashboardStatsData().chartData.map((c) =>
      new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    this.chartInstance.data.datasets[0].data = this.adminDashboardStatsData().chartData.map((c) => c.bookings);

    this.chartInstance.update();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private loadStats(): void {
    this.isStatsLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getDashboardStats(this.selectedPeriod())
      .pipe(finalize(() => this.isStatsLoading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data;
          this.adminDashboardStatsData.set(data);
        },
        error: (err: HttpErrorResponse) => {

          const msg = err.error?.message;
          this.errorMessage.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load Stats. Please try again.',
          );
        },
      });
  }

  protected readonly recentBookings = signal<AdminRecentBookingItemData[]>([]);
  protected readonly needsAttention = signal({
    lowSalesUpcomingEvents48h: 0,
    unreadMessages: { count: 0, oldestHours: 0 },
    newMembers: { thisWeek: 0, priorWeek: 0 },
  });

  protected readonly attentionItems = computed(() => {
    const data = this.needsAttention();
    return [
      {
        type: 'warning',
        icon: 'fa-solid fa-triangle-exclamation',
        title: `${data.lowSalesUpcomingEvents48h} events start within 48 hours with low sales`,
        meta: 'Check pricing, capacity, and promotion in the catalog.',
        actionLabel: 'Review events',
        actionLink: '/dashboard/events',
      },
      {
        type: 'info',
        icon: 'fa-regular fa-envelope',
        title: `${data.unreadMessages.count} messages awaiting first reply`,
        meta:
          data.unreadMessages.count > 0
            ? `Oldest thread is ${data.unreadMessages.oldestHours} hours — keep response time on track.`
            : 'No unread threads right now.',
        actionLabel: 'Open inbox',
        actionLink: '/dashboard/messages',
      },
      {
        type: 'neutral',
        icon: 'fa-solid fa-user-plus',
        title: `${data.newMembers.thisWeek} new members this week`,
        meta: `Up from ${data.newMembers.priorWeek} the week before — consider a welcome campaign.`,
        actionLabel: 'Member directory',
        actionLink: '/dashboard/users',
      },
    ];
  });

  private loadRecentBookings(): void {
    this.isRecentBookingsLoading.set(true);
    this.adminApi
      .getRecentBookings()
      .pipe(finalize(() => this.isRecentBookingsLoading.set(false)))
      .subscribe({
        next: (res) => {
          const formatted = (res.data || []).map((b) => ({
            id: b.id,
            timeLabel: this.getTimeAgo(b.createdAt),
            eventTitle: b.eventTitle,
            ticketSummary: `${b.quantity} ticket${b.quantity > 1 ? 's' : ''}`,
            status: b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()
          }));
          this.recentBookings.set(formatted);
        },
        error: () => {
          this.recentBookings.set([]);
        }
      });
  }

  private loadNeedsAttention(): void {
    this.isAttentionLoading.set(true);
    this.attentionLoadError.set(null);
    this.adminApi
      .getNeedsAttention()
      .pipe(finalize(() => this.isAttentionLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.needsAttention.set(res.data);
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.attentionLoadError.set(
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'Unable to load attention items right now.',
          );
        },
      });
  }

  protected retryNeedsAttention(): void {
    this.loadNeedsAttention();
  }

  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return 'Last week';

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} weeks ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;

    return `${Math.floor(days / 365)} years ago`;
  }


  protected selectPeriod(period: InsightsPeriod): void {
    this.selectedPeriod.set(period);
    this.loadStats();
  }

  private initChart(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    const chartHeight = 400;

    const areaGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
    areaGradient.addColorStop(0, 'rgba(231, 200, 115, 0.5)');
    areaGradient.addColorStop(1, 'rgba(231, 200, 115, 0.0)'); 

    this.chartInstance = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: this.adminDashboardStatsData().chartData.map((c) =>
          new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: 'Bookings Volume',
          data: this.adminDashboardStatsData().chartData.map((c) => c.bookings),
          backgroundColor: areaGradient,
          borderColor: 'rgba(231, 200, 115, 1)',
          borderWidth: 3,
          fill: true, 
          tension: 0.4, 
          pointBackgroundColor: '#0f172a', 
          pointBorderColor: 'rgba(231, 200, 115, 1)',
          pointBorderWidth: 2,
          pointRadius: 0, 
          pointHoverRadius: 6, 
        }]
      },
     options: {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  animation: {
    duration: 1200,
    easing: 'easeOutExpo',
    delay: (context) => context.dataIndex * 50
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      titleColor: '#ffffff',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(231, 200, 115, 0.3)',
      borderWidth: 1,
      padding: 14,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context) => ` ${context.parsed.y} Bookings`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true, 
      ticks: {
        precision: 0, 
        stepSize: 1, 
        color: '#475569',
        padding: 12,
        font: { family: "'Inter', sans-serif", size: 11 }
      },
      border: { display: false },
      grid: { 
        color: 'rgba(255, 255, 255, 0.03)', 
        drawTicks: false 
      }
    },
    x: {
      border: { display: false },
      grid: { display: false, drawTicks: false },
      ticks: {
        color: '#475569',
        padding: 12,
        font: { family: "'Inter', sans-serif", size: 11 }
      }
    }
  }
      }
    });

  }
}
