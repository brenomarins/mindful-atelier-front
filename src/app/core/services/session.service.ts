import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session, StartWorkSessionRequest, StartBreakSessionRequest } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/sessions`;

  listByTask(taskId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${environment.apiUrl}/tasks/${taskId}/sessions`);
  }

  getOpen(): Observable<Session | null> {
    return this.http.get<Session | null>(`${this.base}/open`);
  }

  startWork(req: StartWorkSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.base}/work`, req);
  }

  startBreak(req: StartBreakSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.base}/break`, req);
  }

  complete(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/complete`, {});
  }

  interrupt(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/interrupt`, {});
  }
}
