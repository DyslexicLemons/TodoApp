export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TaskLength = 'Quick' | 'Small' | 'Medium' | 'Long-Term';
export type TaskCategory = 'Health' | 'Working Skills' | 'Personal Skills' | 'Housework' | 'Social';

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
export const TASK_LENGTHS: TaskLength[] = ['Quick', 'Small', 'Medium', 'Long-Term'];
export const TASK_CATEGORIES: TaskCategory[] = [
  'Health',
  'Working Skills',
  'Personal Skills',
  'Housework',
  'Social'
];

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  difficulty: Difficulty;
  length: TaskLength;
  category: TaskCategory;
  isMustDo: boolean;
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
  difficulty: Difficulty;
  length: TaskLength;
  category: TaskCategory;
  isMustDo: boolean;
}

/** URL-safe slug for a length value, used for routing + theming. */
export function lengthToSlug(length: TaskLength): string {
  return length.toLowerCase().replace(/\s+/g, '-');
}

export function slugToLength(slug: string): TaskLength | undefined {
  return TASK_LENGTHS.find((l) => lengthToSlug(l) === slug);
}
