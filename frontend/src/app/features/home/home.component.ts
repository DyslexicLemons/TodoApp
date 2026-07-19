import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { CategoryTasks } from '../../core/models/task.model';
import { TaskListComponent } from '../task-list/task-list.component';
import { CompletedPanelComponent } from '../completed-panel/completed-panel.component';
import { HomeBackgroundComponent } from './home-background/home-background.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TaskListComponent, CompletedPanelComponent, HomeBackgroundComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  private taskRefresh = inject(TaskRefreshService);
  private refreshSub?: Subscription;

  suggestions = signal<CategoryTasks>({ mustDo: [], optional: [] });
  loading = signal(true);

  ngOnInit(): void {
    this.themeService.setTheme('home');
    this.load();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.taskService.getSuggestions().subscribe((result) => {
      this.suggestions.set(result);
      this.loading.set(false);
    });
  }

  onTaskCompleted(): void {
    this.taskRefresh.notify();
  }
}
