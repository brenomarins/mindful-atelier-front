import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { TimeAllocationChartComponent, TagBreakdown } from './time-allocation-chart.component';

const MOCK_DATA: TagBreakdown[] = [
  { tagName: 'Studio Work',       color: '#00452e', hours: 17.1, percentage: 45 },
  { tagName: 'Personal Projects', color: '#284cdb', hours: 11.4, percentage: 30 },
  { tagName: 'Management',        color: '#593300', hours: 9.5,  percentage: 25 },
];

describe('TimeAllocationChartComponent', () => {
  let fixture: ComponentFixture<TimeAllocationChartComponent>;
  let component: TimeAllocationChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimeAllocationChartComponent],
      providers: [provideCharts(withDefaultRegisterables())],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture   = TestBed.createComponent(TimeAllocationChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('builds chartData labels from tag names on ngOnChanges', () => {
    component.data = MOCK_DATA;
    component.totalHours = 38;
    component.ngOnChanges();
    expect(component.chartData.labels).toEqual(['Studio Work', 'Personal Projects', 'Management']);
  });

  it('builds chartData dataset values from hours', () => {
    component.data = MOCK_DATA;
    component.totalHours = 38;
    component.ngOnChanges();
    expect((component.chartData.datasets[0].data as number[])).toEqual([17.1, 11.4, 9.5]);
  });

  it('builds chartData background colors from tag colors', () => {
    component.data = MOCK_DATA;
    component.totalHours = 38;
    component.ngOnChanges();
    expect(component.chartData.datasets[0].backgroundColor).toEqual(['#00452e', '#284cdb', '#593300']);
  });

  it('shows skeleton when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="skeleton"]')).toBeTruthy();
  });
});
