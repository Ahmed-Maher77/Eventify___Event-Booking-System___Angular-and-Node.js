import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header-user-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-user-menu.component.html',
  styleUrl: './header-user-menu.component.scss'
})
export class HeaderUserMenuComponent {
  @Input({ required: true }) displayName = '';
  @Input({ required: true }) displayEmail = '';
  @Input({ required: true }) profileImageUrl = '';
  @Input({ required: true }) isOpen = false;
  @Input() isSolidStyle = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
