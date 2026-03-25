import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tag, CreateTagRequest, UpdateTagRequest } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tags`;

  list(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.base);
  }

  create(req: CreateTagRequest): Observable<Tag> {
    return this.http.post<Tag>(this.base, req);
  }

  update(id: string, req: UpdateTagRequest): Observable<Tag> {
    return this.http.patch<Tag>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
