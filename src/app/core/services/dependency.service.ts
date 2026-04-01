import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TaskDependency, CreateDependencyRequest, TaskDependencySummary,
  CanvasPosition, CanvasPositionRequest
} from '../models/dependency.model';

@Injectable({ providedIn: 'root' })
export class DependencyService {
  private http = inject(HttpClient);
  private depsBase  = `${environment.apiUrl}/task-dependencies`;
  private tasksBase = `${environment.apiUrl}/tasks`;
  private canvasBase = `${environment.apiUrl}/canvas-positions`;

  listAll(): Observable<TaskDependency[]> {
    return this.http.get<TaskDependency[]>(this.depsBase);
  }

  getForTask(taskId: string): Observable<TaskDependencySummary> {
    return this.http.get<TaskDependencySummary>(`${this.tasksBase}/${taskId}/dependencies`);
  }

  create(req: CreateDependencyRequest): Observable<TaskDependency> {
    return this.http.post<TaskDependency>(this.depsBase, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.depsBase}/${id}`);
  }

  getAllPositions(): Observable<CanvasPosition[]> {
    return this.http.get<CanvasPosition[]>(this.canvasBase);
  }

  upsertPosition(taskId: string, req: CanvasPositionRequest): Observable<CanvasPosition> {
    return this.http.patch<CanvasPosition>(`${this.tasksBase}/${taskId}/canvas-position`, req);
  }
}
