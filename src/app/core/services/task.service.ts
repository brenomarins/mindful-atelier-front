import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskRequest, UpdateTaskRequest, ReorderRequest } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tasks`;

  list(filters?: {
    status?: string;
    scheduledDay?: string;
    parentId?: string;
    search?: string;
    tagId?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.status)       params = params.set('status', filters.status);
    if (filters?.scheduledDay) params = params.set('scheduledDay', filters.scheduledDay);
    if (filters?.parentId)     params = params.set('parentId', filters.parentId);
    if (filters?.search)       params = params.set('search', filters.search);
    if (filters?.tagId)        params = params.set('tagId', filters.tagId);
    if (filters?.sortBy)       params = params.set('sortBy', filters.sortBy);
    if (filters?.order)        params = params.set('order', filters.order);
    return this.http.get<Task[]>(this.base, { params });
  }

  get(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/${id}`);
  }

  create(req: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.base, req);
  }

  update(id: string, req: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  reorder(req: ReorderRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/reorder`, req);
  }
}
