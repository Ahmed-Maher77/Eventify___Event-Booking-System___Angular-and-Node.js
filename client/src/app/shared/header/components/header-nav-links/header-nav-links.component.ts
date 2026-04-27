import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type HeaderNavLink = {
  label: string;
  route: string;
};

@Component({
  selector: 'app-header-nav-links',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-nav-links.component.html',
  styleUrl: './header-nav-links.component.scss'
})
export class HeaderNavLinksComponent {
  @Input({ required: true }) links: readonly HeaderNavLink[] = [];
  @Input() isSolidStyle = false;
  @Output() navigate = new EventEmitter<void>();
}
