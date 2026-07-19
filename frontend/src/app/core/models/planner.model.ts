export interface DayInfo {
  date: string;
  isPast: boolean;
  noCapacity: boolean;
  freeMinutes: number;
}

export interface ScheduledItem {
  taskId: string;
  title: string;
  category: string;
  isMustDo: boolean;
  frequency: string;
  day: number;
  start: string;
  end: string;
  estimatedMinutes: number;
}

export interface UnscheduledItem {
  taskId: string;
  title: string;
  frequency: string;
  reason: string;
}

export interface WeekPlan {
  weekStart: string;
  weekEnd: string;
  days: DayInfo[];
  scheduled: ScheduledItem[];
  unscheduled: UnscheduledItem[];
}
