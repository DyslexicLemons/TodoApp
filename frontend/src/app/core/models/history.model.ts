import { TaskCategory } from './task.model';

export interface MonthOption {
  year: number;
  month: number;
  label: string;
}

export interface WeekBucket {
  weekStart: string;
  weekLabel: string;
  completions: number;
}

export interface CategoryCount {
  category: TaskCategory;
  count: number;
}

export interface TrendCategoryEntry {
  category: TaskCategory;
  thisMonth: number;
  previousMonth: number;
  delta: number;
  percentChange: number | null;
}

export interface MonthlyDashboard {
  year: number;
  month: number;
  label: string;
  totalCompletions: number;
  weeklyBreakdown: WeekBucket[];
  categoryBreakdown: CategoryCount[];
  previousMonth: { year: number; month: number; label: string; totalCompletions: number };
  trend: {
    totalDelta: number;
    totalPercentChange: number | null;
    byCategory: TrendCategoryEntry[];
  };
}

export interface WeekdayMatrixRow {
  weekday: string;
  weekdayIndex: number;
  categories: Record<TaskCategory, number>;
  total: number;
}

export interface WeekdayMatrixResponse {
  matrix: WeekdayMatrixRow[];
  categoryTotals: Record<TaskCategory, number>;
  grandTotal: number;
}
