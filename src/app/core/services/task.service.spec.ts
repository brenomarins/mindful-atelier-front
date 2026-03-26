import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() calls GET /tasks', () => {
    service.list().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('list() with filters appends query params', () => {
    service.list({ status: 'backlog', scheduledDay: '2026-03-25' }).subscribe();
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('backlog');
    expect(req.request.params.get('scheduledDay')).toBe('2026-03-25');
    req.flush([]);
  });

  it('list() with parentId appends parentId query param', () => {
    service.list({ parentId: 'parent-123' }).subscribe();
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/tasks`);
    expect(req.request.params.get('parentId')).toBe('parent-123');
    req.flush([]);
  });

  it('update() calls PATCH /tasks/:id', () => {
    service.update('abc', { status: 'done' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/tasks/abc`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'done' });
    req.flush({});
  });
});
