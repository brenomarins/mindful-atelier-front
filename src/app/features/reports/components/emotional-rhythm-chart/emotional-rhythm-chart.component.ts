import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

export interface MoodPoint {
  label: string;
  value: number;   // 0=no entry, 1=bad, 2=low, 3=neutral, 4=good, 5=great
  isToday: boolean;
}

const COLOR_DEFAULT = '#95d4b3'; // primary-fixed-dim
const COLOR_TODAY   = '#00452e'; // primary

@Component({
  selector: 'app-emotional-rhythm-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
    @if (loading) {
      <div data-testid="skeleton" class="animate-pulse h-32 bg-surface-container-high rounded-xl"></div>
    } @else {
      <div class="h-32">
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </div>
    }
  `,
})
export class EmotionalRhythmChartComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() mood: MoodPoint[] = [];
  @Input() loading: boolean = false;

  chartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const labels = ['', 'Bad', 'Low', 'Neutral', 'Good', 'Great'];
            return ` ${labels[ctx.raw as number] ?? 'No entry'}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { display: false, min: 0, max: 5 },
    },
  };

  ngOnChanges(): void {
    this.chartData = {
      labels: (this.mood ?? []).map(m => m.label),
      datasets: [{
        data:            (this.mood ?? []).map(m => m.value),
        backgroundColor: (this.mood ?? []).map(m => m.isToday ? COLOR_TODAY : COLOR_DEFAULT),
        borderRadius:    9999,
        borderSkipped:   false,
      }],
    };
    this.cdr.markForCheck();
  }
}
