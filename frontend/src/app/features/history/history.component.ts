import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { HistoryService } from '../../core/services/history.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { MonthlyDashboard, MonthOption, WeekdayMatrixResponse } from '../../core/models/history.model';
import { WeeklyBarChartComponent } from './weekly-bar-chart.component';
import { WeekdayHeatmapComponent } from './weekday-heatmap.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [WeeklyBarChartComponent, WeekdayHeatmapComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, OnDestroy {
  private historyService = inject(HistoryService);
  private themeService = inject(ThemeService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;

  months = signal<MonthOption[]>([]);
  selectedMonthKey = signal<string>('');
  dashboard = signal<MonthlyDashboard | null>(null);
  matrix = signal<WeekdayMatrixResponse | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.themeService.setTheme('history');
    this.loadAll();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadAll(): void {
    this.loading.set(true);
    this.historyService.getAvailableMonths().subscribe(({ months }) => {
      this.months.set(months);
      const current = months[0];
      if (current) {
        this.selectedMonthKey.set(this.monthKey(current));
        this.loadMonth(current.year, current.month);
      } else {
        this.loading.set(false);
      }
    });
    this.historyService.getWeekdayMatrix().subscribe((matrix) => this.matrix.set(matrix));
  }

  onMonthChange(key: string): void {
    this.selectedMonthKey.set(key);
    const [year, month] = key.split('-').map(Number);
    this.loadMonth(year, month);
  }

  monthKey(option: { year: number; month: number }): string {
    return `${option.year}-${option.month}`;
  }

  private loadMonth(year: number, month: number): void {
    this.loading.set(true);
    this.historyService.getMonthlyDashboard(year, month).subscribe((dashboard) => {
      this.dashboard.set(dashboard);
      this.loading.set(false);
    });
  }
}
