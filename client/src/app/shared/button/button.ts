import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonSize, ButtonVariant, NativeButtonType } from './button.model';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() label = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() buttonType: NativeButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() rounded = true;
  @Input() leftIcon = '';
  @Input() rightIcon = '';
  @Input() customClass = '';
  @Input() routerLink: string | string[] | null = null;
  @Input() href = '';
  @Input() target = '_self';
  @Input() rel = '';

  @Output() pressed = new EventEmitter<Event>();

  protected get isInactive(): boolean {
    return this.disabled || this.loading;
  }

  protected get classes(): string[] {
    return [
      'ev-btn',
      `ev-btn--${this.variant}`,
      `ev-btn--${this.size}`,
      this.fullWidth ? 'ev-btn--full' : '',
      this.rounded ? 'ev-btn--rounded' : '',
      this.isInactive ? 'ev-btn--inactive' : '',
      this.customClass,
    ].filter(Boolean);
  }

  protected get isLinkMode(): boolean {
    return !!this.routerLink || !!this.href;
  }

  protected onClick(event: Event): void {
    if (this.isInactive) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
