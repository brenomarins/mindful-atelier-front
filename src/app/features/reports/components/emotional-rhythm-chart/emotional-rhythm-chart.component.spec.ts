import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { EmotionalRhythmChartComponent, MoodPoint } from './emotional-rhythm-chart.component';

const MOCK_MOOD: MoodPoint[] = [
  { label: 'M',  value: 4, isToday: false },
  { label: 'T',  value: 3, isToday: false },
  { label: 'W',  value: 5, isToday: true  },
  { label: 'Th', value: 4, isToday: false },
  { label: 'F',  value: 0, isToday: false },
  { label: 'Sa', value: 0, isToday: false },
  { label: 'Su', value: 0, isToday: false },
];

describe('EmotionalRhythmChartComponent', () => {
  let fixture: ComponentFixture<EmotionalRhythmChartComponent>;
  let component: EmotionalRhythmChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmotionalRhythmChartComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    });
    fixture   = TestBed.createComponent(EmotionalRhythmChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => { fixture.detectChanges(); expect(component).toBeTruthy(); });

  it('builds chartData labels from mood labels on ngOnChanges', () => {
    component.mood = MOCK_MOOD;
    component.ngOnChanges();
    expect(component.chartData.labels).toEqual(['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']);
  });

  it('builds chartData values from mood values on ngOnChanges', () => {
    component.mood = MOCK_MOOD;
    component.ngOnChanges();
    expect(component.chartData.datasets[0].data).toEqual([4, 3, 5, 4, 0, 0, 0]);
  });

  it('uses primary color for today bar and primary-fixed-dim for others', () => {
    component.mood = MOCK_MOOD;
    component.ngOnChanges();
    const colors = component.chartData.datasets[0].backgroundColor as string[];
    expect(colors[2]).toBe('#00452e');   // W = today
    expect(colors[0]).toBe('#95d4b3');   // M = not today
  });

  it('shows skeleton when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeTruthy();
  });

  it('shows chart canvas when loading=false', () => {
    component.loading = false;
    component.mood = MOCK_MOOD;
    component.ngOnChanges();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });
});
