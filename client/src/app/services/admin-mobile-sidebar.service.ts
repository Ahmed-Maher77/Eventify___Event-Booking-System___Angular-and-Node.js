import { Injectable, signal } from '@angular/core';

/** Mobile admin layout: drawer open/close (desktop uses sidebar collapse instead). */
@Injectable({
  providedIn: 'root'
})
export class AdminMobileSidebarService {
  readonly isDrawerOpen = signal(false);

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((v) => !v);
  }
}
