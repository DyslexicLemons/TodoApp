import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { PlannerService } from '../../core/services/planner.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { WeekPlan } from '../../core/models/planner.model';
import { WeekGridComponent } from './week-grid.component';

// The backend rebuilds the plan from the current time on every fetch, dropping any window that's
// already elapsed - so an undone Weekly/Monthly task whose slot just passed lands in a later slot
// on the next fetch. Polling at this cadence is what turns that into a visible "reschedule" for a
// user who just leaves the tab open, instead of requiring an unrelated create/complete elsewhere.
const AUTO_REFRESH_MS = 60 * 1000;

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
  private pollSub?: Subscription;

  plan = signal<WeekPlan | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.themeService.setTheme('planner');
    this.load();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.load());
    this.pollSub = interval(AUTO_REFRESH_MS).subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.plannerService.getWeekPlan().subscribe((plan) => {
      this.plan.set(plan);
      this.loading.set(false);
    });
  }
}
