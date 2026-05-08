import { Component, Input } from '@angular/core';
import { SectionLoader } from '../section-loader/section-loader';

@Component({
  selector: 'app-admin-list-state',
  standalone: true,
  imports: [SectionLoader],
  templateUrl: './admin-list-state.component.html',
})
export class AdminListStateComponent {
  @Input({ required: true }) isLoading = false;
  @Input() errorMessage: string | null = null;
  @Input() loadingLabel = 'Loading...';
}
