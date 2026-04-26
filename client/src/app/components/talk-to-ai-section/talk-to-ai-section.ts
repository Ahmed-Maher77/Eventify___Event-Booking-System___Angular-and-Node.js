import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '../../shared/button/button';
import { ChatStoreService } from '../../services/chat-store.service';
import { AiFeatureItem } from './talk-to-ai-section.model';

@Component({
  selector: 'app-talk-to-ai-section',
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './talk-to-ai-section.html',
  styleUrl: './talk-to-ai-section.scss',
})
export class TalkToAiSection {
  private readonly chatStoreService = inject(ChatStoreService);
  protected readonly features: AiFeatureItem[] = [
    { text: 'Find events that match your vibe' },
    { text: 'Compare price, date, and category quickly' },
    { text: 'Get smart picks for this week or weekend' }
  ];
  protected readonly isAssistantOnline = this.chatStoreService.isAssistantOnline;
  protected readonly draftMessage = signal('');
  protected readonly isMenuOpen = signal(false);

  protected startChatFromCta(): void {
    this.chatStoreService.activateChatScreen();
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((currentState) => !currentState);
  }

  protected openChatScreen(): void {
    this.chatStoreService.activateChatScreen();
    this.isMenuOpen.set(false);
  }

  protected submitMessage(): void {
    const message = this.draftMessage().trim();
    if (!message) {
      return;
    }

    this.chatStoreService.addUserMessage(message);
    this.chatStoreService.activateChatScreen();
    this.draftMessage.set('');
    this.isMenuOpen.set(false);
  }

  @HostListener('document:click')
  protected closeMenuOnOutsideClick(): void {
    this.isMenuOpen.set(false);
  }

  protected onMenuAreaClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
