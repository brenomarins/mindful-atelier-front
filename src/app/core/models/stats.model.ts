export interface TrendPointDto {
  label: string;
  hours: number;
}

export interface TaskStatPointDto {
  taskId: string;
  title: string;
  minutesFocused: number;
  completed: number;
  interrupted: number;
  started: number;
}

export interface DailyFocusPointDto {
  date: string;
  hours: number;
}

export interface StatsResponse {
  totalMinutesFocused: number;
  totalCompleted: number;
  totalInterrupted: number;
  completionRate: number | null;
  weeklyTrend: TrendPointDto[];
  taskStats: TaskStatPointDto[];
  dailyFocus: DailyFocusPointDto[];
}
