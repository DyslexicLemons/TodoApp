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
  items: DayColumnItem[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
      items: plan.scheduled
        .filter((s) => s.day === index)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map((s) => ({
          taskId: s.taskId,
          title: s.title,
          category: s.category,
          isMustDo: s.isMustDo,
          timeLabel: `${formatTime(s.start)} - ${formatTime(s.end)}`
        }))
    }));
  });
}
