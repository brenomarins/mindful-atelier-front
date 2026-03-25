export type SessionType = 'work' | 'short_break' | 'long_break';

export interface Session {
  id: string;
  taskId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  type: SessionType;
  durationMinutes: number;
  isOpen: number; // 1 = running, 0 = closed
}

export interface StartWorkSessionRequest {
  taskId: string;
}

export interface StartBreakSessionRequest {
  type: 'short_break' | 'long_break';
  taskId?: string;
}
