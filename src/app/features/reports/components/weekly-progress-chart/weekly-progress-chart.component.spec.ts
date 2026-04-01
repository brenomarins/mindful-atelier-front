import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { WeeklyProgressChartComponent } from './weekly-progress-chart.component';
import { TrendPointDto } from '../../../../core/models/stats.model';

const MOCK_TREND: TrendPointDto[] = [
  { label: 'Mon', hours: 3.5 },
  { label: 'Tue', hours: 5.0 },
  { label: 'Wed', hours: 2.0 },
  { label: 'Thu', hours: 4.5 },
  { label: 'Fri', hours: 6.0 },
  { label: 'Sat', hours: 1.0 },
  { label: 'Sun', hours: 0.5 },
];

describe('WeeklyProgressChartComponent', () => {
  let fixture: ComponentFixture<WeeklyProgressChartComponent>;
  let component: WeeklyProgressChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WeeklyProgressChartComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    });
    fixture   = TestBed.createComponent(WeeklyProgressChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { fixture.detectChanges(); expect(component).toBeTruthy(); });

  it('builds chartData labels from trend labels on ngOnChanges', () => {
    component.trend = MOCK_TREND;
    component.ngOnChanges();
    expect(component.chartData.labels).toEqual(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  });

  it('builds chartData dataset from trend hours on ngOnChanges', () => {
    component.trend = MOCK_TREND;
    component.ngOnChanges();
    expect(component.chartData.datasets[0].data).toEqual([3.5,5.0,2.0,4.5,6.0,1.0,0.5]);
  });

  it('shows skeleton when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeTruthy();
  });

  it('shows chart canvas when loading=false', () => {
    component.loading = false;
    component.trend = MOCK_TREND;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });
});
