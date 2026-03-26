import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompletionStats {
  rate: number;     // 0–100
  message: string;  // e.g. "You're doing great this month."
}

export interface TipCard {
  message: string;
}

// TODO [backend]: create GET /stats/completion returning { rate: number, message: string }
// Used by the Backlog stats card to show focus completion rate for the current month.

// TODO [backend]: create GET /tip-card returning { message: string }
// Used by the Backlog mindful tip card. Consider rotating tips per day or randomly.

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCompletion(): Observable<CompletionStats> {
    return this.http.get<CompletionStats>(`${this.base}/stats/completion`);
  }

  getTipCard(): Observable<TipCard> {
    return this.http.get<TipCard>(`${this.base}/tip-card`);
  }
}
