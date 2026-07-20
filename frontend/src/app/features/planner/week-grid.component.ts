import { Component, computed, input } from '@angular/core';
import { WeekPlan } from '../../core/models/planner.model';

interface DayColumnItem {
  taskId: string;
  title: string;
  category: string;
  isMustDo: boolean;
  timeLabel: string;
}

interface DayColumn {
  label: string;
  dateLabel: string;
  isPast: boolean;
  noCapacity: boolean;
  timeLeftLabel: string | null;
  items: DayColumnItem[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Within this window of the actual current time, a scheduled start reads as "Now" rather than
// a clock time - the backend schedules today's first item starting at the moment the plan was
// built, and showing that back as e.g. "3:47 PM" reads as an arbitrary time rather than "right now".
const NOW_TOLERANCE_MS = 2 * 60 * 1000;

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatStartTime(iso: string): string {
  const delta = new Date(iso).getTime() - Date.now();
  if (delta >= -NOW_TOLERANCE_MS && delta <= NOW_TOLERANCE_MS) return 'Now';
  return formatClockTime(iso);
}

function formatTimeLeft(freeMinutes: number): string {
  const hours = Math.floor(freeMinutes / 60);
  const minutes = freeMinutes % 60;
  if (hours === 0) return `${minutes}m left`;
  if (minutes === 0) return `${hours}h left`;
  return `${hours}h ${minutes}m left`;
}

@Component({
  selector: 'app-week-grid',
  standalone: true,
  templateUrl: './week-grid.component.html',
  styleUrl: './week-grid.component.scss'
})
export class WeekGridComponent {
  plan = input.required<WeekPlan>();

  columns = computed<DayColumn[]>(() => {
    const plan = this.plan();
    return plan.days.map((day, index) => ({
      label: DAY_LABELS[index],
      // The backend buckets days in UTC, so the label must read in UTC too - otherwise a
      // browser timezone behind UTC would show the wrong calendar date for this column.
      dateLabel: new Date(day.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }),
      isPast: day.isPast,
      noCapacity: day.noCapacity,
      timeLeftLabel: day.isToday && !day.noCapacity ? formatTimeLeft(day.freeMinutes) : null,
      items: plan.scheduled
        .filter((s) => s.day === index)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map((s) => ({
          taskId: s.taskId,
          title: s.title,
          category: s.category,
          isMustDo: s.isMustDo,
          timeLabel: `${formatStartTime(s.start)} - ${formatClockTime(s.end)}`
        }))
    }));
  });
}
