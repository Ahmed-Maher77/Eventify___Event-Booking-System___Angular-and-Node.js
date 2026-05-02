import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss'
})
export class ToastHost {
  protected readonly toastService = inject(ToastService);
}
