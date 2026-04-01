import {
  Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

export interface TagBreakdown {
  tagName: string;
  color: string;
  hours: number;
  percentage: number;
}

@Component({
  selector: 'app-time-allocation-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
@if (loading) {
  <!-- Skeleton -->
  <div data-testid="skeleton" class="animate-pulse">
    <div class="w-48 h-48 rounded-full bg-surface-container-high mx-auto mb-6"></div>
    <div class="space-y-3">
      <div class="h-4 bg-surface-container-high rounded-full w-3/4"></div>
      <div class="h-4 bg-surface-container-high rounded-full w-2/3"></div>
      <div class="h-4 bg-surface-container-high rounded-full w-1/2"></div>
    </div>
  </div>
} @else {
  <!-- Chart -->
  <div>
    <div class="relative flex justify-center py-6">
      <div class="relative w-64 h-64">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="'doughnut'">
        </canvas>
        <!-- Center label -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-4xl font-headline font-extrabold text-on-surface">{{ totalHours }}h</span>
          <span class="text-xs font-label text-on-surface-variant mt-1">Total Focused</span>
        </div>
      </div>
    </div>

    <!-- Custom legend -->
    <div class="mt-6 space-y-4">
      @for (item of data; track item.tagName) {
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full flex-shrink-0" [style.background-color]="item.color"></div>
            <span class="text-sm font-medium text-on-surface font-body">{{ item.tagName }}</span>
          </div>
          <span class="text-sm font-bold text-on-surface font-body">
            {{ item.hours }}h ({{ item.percentage }}%)
          </span>
        </div>
      }
      @if (data.length === 0) {
        <div class="text-center text-sm text-on-surface-variant font-body py-4">
          No data yet
        </div>
      }
    </div>
  </div>
}
  `,
})
export class TimeAllocationChartComponent implements OnChanges {
  @Input() data: TagBreakdown[] = [];
  @Input() totalHours: number = 0;
  @Input() loading: boolean = false;

  chartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };

  readonly chartOptions: ChartOptions<'doughnut'> = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw}h`,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.chartData = {
      labels: (this.data ?? []).map(d => d.tagName),
      datasets: [{
        data:            (this.data ?? []).map(d => d.hours),
        backgroundColor: (this.data ?? []).map(d => d.color),
        borderWidth:     0,
        hoverOffset:     4,
      }],
    };
    this.cdr.markForCheck();
  }
}
