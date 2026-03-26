import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { StatsService } from './stats.service';
import { environment } from '../../../environments/environment';

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
    service.getCompletion().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/stats/completion`);
    expect(req.request.method).toBe('GET');
    req.flush({ rate: 74, message: 'Great month!' });
  });

  it('getTipCard() calls GET /tip-card', () => {
    service.getTipCard().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/tip-card`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'The backlog is a space for storage, not stress.' });
  });
});
