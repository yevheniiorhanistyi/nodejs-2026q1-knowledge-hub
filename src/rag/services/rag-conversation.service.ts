import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RagConversationService {
  private readonly logger = new Logger(RagConversationService.name);
  private readonly store = new Map<string, Conversation>();
  private readonly maxMessages: number;

  constructor(private readonly config: ConfigService) {
    this.maxMessages = this.config.get<number>('rag.maxMessages', 20);
  }

  createOrGet(conversationId?: string): Conversation {
    const id = conversationId ?? randomUUID();

    if (!this.store.has(id)) {
      const conversation: Conversation = {
        id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.store.set(id, conversation);
      this.logger.debug(`Created conversation: ${id}`);
    }

    return this.store.get(id)!;
  }

  addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
  ): void {
    const conversation = this.createOrGet(conversationId);

    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    conversation.updatedAt = new Date().toISOString();

    if (conversation.messages.length > this.maxMessages) {
      conversation.messages = conversation.messages.slice(-this.maxMessages);
    }
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return this.store.get(conversationId)?.messages ?? [];
  }

  getConversation(conversationId: string): Conversation | null {
    return this.store.get(conversationId) ?? null;
  }
}
