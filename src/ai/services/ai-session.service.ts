import { Injectable, Logger } from '@nestjs/common';

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

interface SessionEntry {
  messages: ConversationMessage[];
  lastAccessedAt: number;
}

const MAX_MESSAGES_PER_SESSION = 20;
const SESSION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class AiSessionService {
  private readonly logger = new Logger(AiSessionService.name);
  private readonly sessions = new Map<string, SessionEntry>();

  getHistory(sessionId: string): ConversationMessage[] {
    const entry = this.sessions.get(sessionId);
    if (!entry) return [];
    if (Date.now() - entry.lastAccessedAt > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      this.logger.debug(`Session ${sessionId} expired and removed`);
      return [];
    }
    entry.lastAccessedAt = Date.now();
    return entry.messages;
  }

  addMessage(sessionId: string, message: ConversationMessage): void {
    let entry = this.sessions.get(sessionId);
    if (!entry) {
      entry = { messages: [], lastAccessedAt: Date.now() };
      this.sessions.set(sessionId, entry);
    }
    entry.messages.push(message);
    entry.lastAccessedAt = Date.now();

    if (entry.messages.length > MAX_MESSAGES_PER_SESSION) {
      entry.messages = entry.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getStats(): { activeSessions: number } {
    return { activeSessions: this.sessions.size };
  }
}
