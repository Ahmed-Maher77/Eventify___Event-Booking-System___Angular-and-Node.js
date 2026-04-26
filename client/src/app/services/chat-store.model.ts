export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  content: string;
  role: ChatMessageRole;
  createdAt: string;
}
