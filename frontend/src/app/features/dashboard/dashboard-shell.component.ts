import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AddTaskModalComponent } from '../add-task/add-task-modal.component';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { DarkModeService } from '../../core/services/dark-mode.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AddTaskModalComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent {
  private taskRefresh = inject(TaskRefreshService);
  private darkMode = inject(DarkModeService);
  private elementRef = inject(ElementRef);

  readonly tabs = [
    { label: 'Home', path: '/home', muted: false },
    { label: 'Quick', path: '/tasks/quick', muted: false },
    { label: 'Small', path: '/tasks/small', muted: false },
    { label: 'Medium', path: '/tasks/medium', muted: false },
    { label: 'Long-Term', path: '/tasks/long-term', muted: false },
    { label: 'Completed Task History', path: '/history', muted: true }
  ];

  isAddTaskOpen = signal(false);
  isSettingsOpen = signal(false);
  isDarkMode = this.darkMode.isDark;

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

  toggleSettings(): void {
    this.isSettingsOpen.update((open) => !open);
  }

  toggleDarkMode(): void {
    this.darkMode.toggle();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isSettingsOpen()) return;
    const menu = this.elementRef.nativeElement.querySelector('.settings-menu');
    if (menu && !menu.contains(event.target as Node)) {
      this.isSettingsOpen.set(false);
    }
  }
}
