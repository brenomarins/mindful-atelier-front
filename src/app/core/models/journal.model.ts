export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad';

export interface JournalEntry {
  date: string; // "YYYY-MM-DD"
  mood: Mood;
  achievements?: string | null;
  difficulties?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryRequest {
  mood: Mood;
  achievements?: string;
  difficulties?: string;
}
