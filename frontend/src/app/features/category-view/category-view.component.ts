import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { CategoryTasks, TaskLength, lengthToSlug } from '../../core/models/task.model';
import { TaskListComponent } from '../task-list/task-list.component';
import { CompletedPanelComponent } from '../completed-panel/completed-panel.component';

@Component({
  selector: 'app-category-view',
  standalone: true,
  imports: [TaskListComponent, CompletedPanelComponent],
  templateUrl: './category-view.component.html',
  styleUrl: './category-view.component.scss'
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;

  length!: TaskLength;
  categoryTasks = signal<CategoryTasks>({ mustDo: [], optional: [] });
  loading = signal(true);

  ngOnInit(): void {
    this.length = this.route.snapshot.data['length'] as TaskLength;
    this.themeService.setTheme(lengthToSlug(this.length));
    this.loadTasks();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.loadTasks());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasksByLength(this.length).subscribe((result) => {
      this.categoryTasks.set(result);
      this.loading.set(false);
    });
  }

  onTaskCompleted(): void {
    this.taskRefresh.notify();
  }
}
