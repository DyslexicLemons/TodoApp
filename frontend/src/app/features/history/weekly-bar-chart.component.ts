import { Component, Input } from '@angular/core';
import { WeekBucket } from '../../core/models/history.model';

@Component({
  selector: 'app-weekly-bar-chart',
  standalone: true,
  templateUrl: './weekly-bar-chart.component.html',
  styleUrl: './weekly-bar-chart.component.scss'
})
export class WeeklyBarChartComponent {
  @Input({ required: true }) weeks!: WeekBucket[];

  get maxCompletions(): number {
    return Math.max(1, ...this.weeks.map((w) => w.completions));
  }

  barHeightPercent(week: WeekBucket): number {
    return Math.max(4, (week.completions / this.maxCompletions) * 100);
  }
}
