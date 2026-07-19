import { Component, Input } from '@angular/core';
import { WeekdayMatrixRow } from '../../core/models/history.model';
import { TASK_CATEGORIES, TaskCategory } from '../../core/models/task.model';

@Component({
  selector: 'app-weekday-heatmap',
  standalone: true,
  templateUrl: './weekday-heatmap.component.html',
  styleUrl: './weekday-heatmap.component.scss'
})
export class WeekdayHeatmapComponent {
  @Input({ required: true }) matrix!: WeekdayMatrixRow[];

  readonly categories = TASK_CATEGORIES;

  get gridMax(): number {
    let max = 0;
    for (const row of this.matrix) {
      for (const category of this.categories) {
        max = Math.max(max, row.categories[category]);
      }
    }
    return Math.max(1, max);
  }

  intensity(count: number): number {
    return Math.max(6, (count / this.gridMax) * 100);
  }

  isDark(count: number): boolean {
    return this.intensity(count) > 55;
  }

  cellTitle(row: WeekdayMatrixRow, category: TaskCategory): string {
    return `${category}, ${row.weekday}: ${row.categories[category]} completions`;
  }
}
