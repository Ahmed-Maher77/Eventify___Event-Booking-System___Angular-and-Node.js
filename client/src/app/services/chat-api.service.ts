import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage } from './chat-store.model';

export interface ChatCompletionResponse {
  status: string;
  data: {
    reply: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.backendApiUrl}/chat`;

  /**
   * Send messages to the AI assistant and get a reply
   * @param messages Current message history
   * @returns Observable of the assistant's reply string
   */
  getCompletion(messages: ChatMessage[]): Observable<string> {
    // We only send the role and content to the backend
    const payload = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    return this.http.post<ChatCompletionResponse>(`${this.apiUrl}/completions`, payload, {
      withCredentials: true
    }).pipe(
      map(response => response.data.reply)
    );
  }
}
