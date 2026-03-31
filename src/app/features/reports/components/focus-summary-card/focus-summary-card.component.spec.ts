import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { FocusSummaryCardComponent, StreakDay } from './focus-summary-card.component';
import { TrendPointDto } from '../../../../core/models/stats.model';

const MOCK_TREND: TrendPointDto[] = [
  { label: 'Mon', hours: 3.5 },  // active
  { label: 'Tue', hours: 5.0 },  // active
  { label: 'Wed', hours: 0 },    // inactive
  { label: 'Thu', hours: 4.5 },  // active
  { label: 'Fri', hours: 6.0 },  // active
  { label: 'Sat', hours: 0 },    // inactive
  { label: 'Sun', hours: 0 },    // inactive
];

describe('FocusSummaryCardComponent', () => {
  let fixture: ComponentFixture<FocusSummaryCardComponent>;
  let component: FocusSummaryCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FocusSummaryCardComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    });
    fixture   = TestBed.createComponent(FocusSummaryCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { fixture.detectChanges(); expect(component).toBeTruthy(); });

  it('renders focusScore in template', () => {
    component.focusScore = 88; component.pomodoroCount = 42;
    component.trend = []; component.totalCompleted = 24;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('88');
  });

  it('renders pomodoroCount in template', () => {
    component.focusScore = 88; component.pomodoroCount = 42;
    component.trend = []; component.totalCompleted = 24;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('42');
  });

  it('marks streak day as active when trend hours > 0', () => {
    component.focusScore = 80; component.pomodoroCount = 10;
    component.trend = MOCK_TREND; component.totalCompleted = 24;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.streakDays.filter(d => d.active).length).toBe(4);
  });

  it('marks streak day as inactive when trend hours === 0', () => {
    component.focusScore = 80; component.pomodoroCount = 10;
    component.trend = MOCK_TREND; component.totalCompleted = 24;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.streakDays.filter(d => !d.active).length).toBe(3);
  });

  it('shows skeleton when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeTruthy();
  });
});
