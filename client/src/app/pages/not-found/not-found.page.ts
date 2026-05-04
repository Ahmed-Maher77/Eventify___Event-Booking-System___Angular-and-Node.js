import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.scss'
})
export class NotFoundPage {
  private readonly router = inject(Router);
  protected readonly searchQuery = signal('');

  protected onSearch(event: Event, rawQuery: string): void {
    event.preventDefault();

    const query = rawQuery.trim();
    void this.router.navigate(['/events'], {
      queryParams: query ? { name: query } : {}
    });
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }
}
