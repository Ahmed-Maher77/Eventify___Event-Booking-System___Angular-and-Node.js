import { Injectable, signal } from '@angular/core';
import { ChatMessage } from './chat-store.model';

@Injectable({
  providedIn: 'root'
})
export class ChatStoreService {
  readonly isChatScreenActive = signal(false);
  readonly isAssistantOnline = signal(this.getOnlineStatus());
  readonly messages = signal<ChatMessage[]>([]);

  constructor() {
    window.addEventListener('online', this.handleConnectivityChange);
    window.addEventListener('offline', this.handleConnectivityChange);
  }

  activateChatScreen(): void {
    this.isChatScreenActive.set(true);
  }

  addUserMessage(content: string): void {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      return;
    }

    this.messages.update((current) => [
      ...current,
      {
        id: this.generateMessageId(),
        content: normalizedContent,
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private readonly handleConnectivityChange = () => {
    this.isAssistantOnline.set(this.getOnlineStatus());
  };

  private getOnlineStatus(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }

    return navigator.onLine;
  }
}
