import { startOfDay, startOfWeek, startOfMonth } from '../../../../../shared/dateLogic';

export type TaskLength = 'Quick' | 'Small' | 'Medium' | 'Long-Term';
export type TaskCategory = 'Health' | 'Working Skills' | 'Personal Skills' | 'Housework' | 'Social' | 'Self-Expression';
export type TaskFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'One-Time';

export const TASK_LENGTHS: TaskLength[] = ['Quick', 'Small', 'Medium', 'Long-Term'];
export const TASK_CATEGORIES: TaskCategory[] = [
  'Health',
  'Working Skills',
  'Personal Skills',
  'Housework',
  'Social',
  'Self-Expression'
];
export const TASK_FREQUENCIES: TaskFrequency[] = ['Daily', 'Weekly', 'Monthly', 'One-Time'];

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  estimatedMinutes: number;
  length: TaskLength;
  category: TaskCategory;
  isMustDo: boolean;
  frequency: TaskFrequency;
  targetCount: number;
  currentStreak: number;
  completionHistory: string[];
  lastCompletedDate: string | null;
}

export interface CategoryTasks {
  mustDo: Task[];
  optional: Task[];
}

export interface TaskDetail {
  task: Task;
  stats: { totalCompletions: number; currentStreak: number };
  fact: string | null;
  easierTip: string;
}

export interface NewTask {
  title: string;
  description?: string;
  dueDate?: string | null;
  estimatedMinutes: number;
  category: TaskCategory;
  isMustDo: boolean;
  frequency: TaskFrequency;
  targetCount: number;
}

const CATEGORY_EMOJI: Record<TaskCategory, string> = {
  Health: '💪',
  'Working Skills': '💼',
  'Personal Skills': '📚',
  Housework: '🧹',
  Social: '👥',
  'Self-Expression': '🎨'
};

/** Emoji shorthand for a task category, used in place of the text label in collapsed views. */
export function categoryToEmoji(category: TaskCategory): string {
  return CATEGORY_EMOJI[category];
}

/** URL-safe slug for a length value, used for routing + theming. */
export function lengthToSlug(length: TaskLength): string {
  return length.toLowerCase().replace(/\s+/g, '-');
}

export function slugToLength(slug: string): TaskLength | undefined {
  return TASK_LENGTHS.find((l) => lengthToSlug(l) === slug);
}

/** Human-readable approximation of an estimated duration, e.g. "<30 min", "~2 hours". */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 30) return '<30 min';
  if (minutes < 60) return `~${Math.round(minutes / 15) * 15} min`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `~${hours} hour${hours === 1 ? '' : 's'}`;
}

/** How many of a task's completions fall within its current Weekly/Monthly period, for the progress pie. */
export function completionsInCurrentPeriod(task: Task, now: Date = new Date()): number {
  if (task.frequency === 'Weekly') {
    const currentWeek = startOfWeek(now).getTime();
    return task.completionHistory.filter((d) => startOfWeek(new Date(d)).getTime() === currentWeek).length;
  }
  if (task.frequency === 'Monthly') {
    const currentMonth = startOfMonth(now).getTime();
    return task.completionHistory.filter((d) => startOfMonth(new Date(d)).getTime() === currentMonth).length;
  }
  return task.completionHistory.length;
}

/** Whether a task has nothing left to do for its current day/week/month/lifetime, per its frequency. Mirrors backend/src/services/frequencyService.js#isDoneForCurrentPeriod. */
export function isDoneForCurrentPeriod(task: Task, now: Date = new Date()): boolean {
  if (task.frequency === 'Weekly') {
    return completionsInCurrentPeriod(task, now) >= task.targetCount;
  }
  if (task.frequency === 'Monthly') {
    return completionsInCurrentPeriod(task, now) >= 1;
  }
  if (task.frequency === 'One-Time') {
    return task.completionHistory.length > 0;
  }
  return Boolean(task.lastCompletedDate) && startOfDay(task.lastCompletedDate).getTime() === startOfDay(now).getTime();
}
