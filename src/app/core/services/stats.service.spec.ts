import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StatsService } from './stats.service';
import { environment } from '../../../environments/environment';
import { StatsResponse } from '../models/stats.model';

describe('StatsService', () => {
  let service: StatsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatsService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getCompletion() calls GET /stats/completion', () => {
    let result: { rate: number; message: string } | undefined;
    service.getCompletion().subscribe(r => result = r);
    const req = http.expectOne(`${environment.apiUrl}/stats/completion`);
    expect(req.request.method).toBe('GET');
    req.flush({ rate: 74, message: 'Great month!' });
    expect(result?.rate).toBe(74);
    expect(result?.message).toBe('Great month!');
  });

  it('getTipCard() calls GET /tip-card', () => {
    let result: { message: string } | undefined;
    service.getTipCard().subscribe(r => result = r);
    const req = http.expectOne(`${environment.apiUrl}/tip-card`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'The backlog is a space for storage, not stress.' });
    expect(result?.message).toBe('The backlog is a space for storage, not stress.');
  });

  it('getStats() calls GET /stats?filter=week by default', () => {
    let result: StatsResponse | undefined;
    service.getStats().subscribe(r => result = r);
    const req = http.expectOne(`${environment.apiUrl}/stats?filter=week`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalMinutesFocused: 120, totalCompleted: 5, totalInterrupted: 1, completionRate: 0.83, weeklyTrend: [], taskStats: [], dailyFocus: [] });
    expect(result?.totalMinutesFocused).toBe(120);
    expect(result?.completionRate).toBe(0.83);
  });

  it('getStats("all") calls GET /stats?filter=all', () => {
    let result: StatsResponse | undefined;
    service.getStats('all').subscribe(r => result = r);
    const req = http.expectOne(`${environment.apiUrl}/stats?filter=all`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalMinutesFocused: 600, totalCompleted: 20, totalInterrupted: 3, completionRate: 0.87, weeklyTrend: [], taskStats: [], dailyFocus: [] });
    expect(result?.totalMinutesFocused).toBe(600);
    expect(result?.totalCompleted).toBe(20);
  });
});
