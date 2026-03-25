import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JournalEntry, JournalEntryRequest } from '../models/journal.model';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/journal`;

  list(from?: string, to?: string): Observable<JournalEntry[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<JournalEntry[]>(this.base, { params });
  }

  getByDate(date: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.base}/${date}`);
  }

  upsert(date: string, req: JournalEntryRequest): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.base}/${date}`, req);
  }
}
