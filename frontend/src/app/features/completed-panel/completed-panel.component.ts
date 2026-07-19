import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { StreakFlameIconComponent } from './streak-flame-icon.component';
import { AccomplishmentPopupComponent } from './accomplishment-popup.component';

@Component({
  selector: 'app-completed-panel',
  standalone: true,
  imports: [StreakFlameIconComponent, AccomplishmentPopupComponent],
  templateUrl: './completed-panel.component.html',
  styleUrl: './completed-panel.component.scss'
})
export class CompletedPanelComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;

  completedTasks = signal<Task[]>([]);
  hoveredTaskId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  load(): void {
    this.taskService.getCompletedTasks().subscribe((tasks) => this.completedTasks.set(tasks));
  }
}
