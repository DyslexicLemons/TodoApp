import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { PlannerService } from '../../core/services/planner.service';
import { TaskService } from '../../core/services/task.service';
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
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;
  private pollSub?: Subscription;

  plan = signal<WeekPlan | null>(null);
  loading = signal(true);
  recalculating = signal(false);
  private lastRecalculatedAt: Date | null = null;

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
      this.lastRecalculatedAt = new Date();
    });
  }

  /** Manual recalculation entry point: confirms with the user before rebuilding the plan, and uses
   *  a stronger warning if nothing has actually changed since the last recalculation (initial load,
   *  poll, or another view's edit/create) so the ask isn't a silent no-op. */
  recalculate(): void {
    this.recalculating.set(true);
    this.taskService.getLastModified().subscribe(({ lastModified }) => {
      this.recalculating.set(false);
      const lastChange = lastModified ? new Date(lastModified) : null;
      const hasChangesSinceLastRecalc = !!lastChange && (!this.lastRecalculatedAt || lastChange > this.lastRecalculatedAt);

      const message = hasChangesSinceLastRecalc
        ? "Recalculate this week's plan to include your recent task changes?"
        : "No tasks have been added or edited since your last recalculation, so the plan will come out the same. Recalculate anyway?";

      if (window.confirm(message)) {
        this.load();
      }
    });
  }
}
