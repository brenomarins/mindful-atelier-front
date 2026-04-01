import {
  Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { TrendPointDto } from '../../../../core/models/stats.model';

@Component({
  selector: 'app-weekly-progress-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
    @if (loading) {
      <div data-testid="skeleton" class="animate-pulse h-48">...</div>
    } @else {
      <div class="h-48">
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </div>
    }
  `,
})
export class WeeklyProgressChartComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  @Input() trend: TrendPointDto[] = [];
  @Input() loading: boolean = false;

  chartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { display: false },
    },
  };

  ngOnChanges(): void {
    this.chartData = {
      labels: (this.trend ?? []).map(t => t.label),
      datasets: [{
        data: (this.trend ?? []).map(t => t.hours),
        backgroundColor: '#00452e',
        borderRadius: 4,
        borderSkipped: false,
      }],
    };
    this.cdr.markForCheck();
  }
}
