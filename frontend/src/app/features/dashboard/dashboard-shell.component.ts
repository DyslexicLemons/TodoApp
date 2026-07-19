import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AddTaskModalComponent } from '../add-task/add-task-modal.component';
import { TaskRefreshService } from '../../core/services/task-refresh.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AddTaskModalComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent {
  private taskRefresh = inject(TaskRefreshService);

  readonly tabs = [
    { label: 'Home', path: '/home' },
    { label: 'Quick', path: '/tasks/quick' },
    { label: 'Small', path: '/tasks/small' },
    { label: 'Medium', path: '/tasks/medium' },
    { label: 'Long-Term', path: '/tasks/long-term' }
  ];

  isAddTaskOpen = signal(false);

  openAddTask(): void {
    this.isAddTaskOpen.set(true);
  }

  closeAddTask(): void {
    this.isAddTaskOpen.set(false);
  }

  onTaskCreated(): void {
    this.isAddTaskOpen.set(false);
    this.taskRefresh.notify();
  }
}
