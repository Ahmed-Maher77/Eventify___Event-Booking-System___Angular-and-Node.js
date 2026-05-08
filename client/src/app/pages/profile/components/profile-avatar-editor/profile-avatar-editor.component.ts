import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-profile-avatar-editor',
  standalone: true,
  templateUrl: './profile-avatar-editor.component.html',
  styleUrl: './profile-avatar-editor.component.scss',
})
export class ProfileAvatarEditorComponent {
  @Input({ required: true }) imageUrl = '';
  @Input({ required: true }) altText = '';
  @Input() busy = false;
  @Output() fileSelected = new EventEmitter<File | null>();

  protected onFileInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.fileSelected.emit(file);
    if (target) {
      target.value = '';
    }
  }
}
