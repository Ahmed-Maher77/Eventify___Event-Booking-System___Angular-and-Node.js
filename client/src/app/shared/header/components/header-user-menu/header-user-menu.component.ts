import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { runHeaderUserMenuOpenAnimations } from './header-user-menu.component.animations';

@Component({
  selector: 'app-header-user-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-user-menu.component.html',
  styleUrl: './header-user-menu.component.scss',
})
export class HeaderUserMenuComponent implements OnChanges {
  private readonly host = inject(ElementRef<HTMLElement>);
  @Input({ required: true }) displayName = '';
  @Input({ required: true }) displayEmail = '';
  @Input({ required: true }) profileImageUrl = '';
  @Input() favoriteCount = 0;
  @Input({ required: true }) isOpen = false;
  @Input() isSolidStyle = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      runHeaderUserMenuOpenAnimations(this.host.nativeElement);
    }
  }
}
