import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlannerService } from '../../core/services/planner.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { WeekPlan } from '../../core/models/planner.model';
import { WeekGridComponent } from './week-grid.component';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [WeekGridComponent],
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss'
})
export class PlannerComponent implements OnInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private themeService = inject(ThemeService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;

  plan = signal<WeekPlan | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.themeService.setTheme('planner');
    this.load();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.plannerService.getWeekPlan().subscribe((plan) => {
      this.plan.set(plan);
      this.loading.set(false);
    });
  }
}
