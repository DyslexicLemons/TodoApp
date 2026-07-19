import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Task, TaskDetail, formatEstimatedTime } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  private taskService = inject(TaskService);

  @Input({ required: true }) task!: Task;
  @Input() showLength = false;
  @Output() completed = new EventEmitter<void>();

  formatEstimatedTime = formatEstimatedTime;

  detail = signal<TaskDetail | null>(null);
  loadingDetail = signal(false);
  completing = signal(false);
  isOpen = signal(false);
  private closeTimeout?: ReturnType<typeof setTimeout>;

  onHoverStart(): void {
    clearTimeout(this.closeTimeout);
    this.isOpen.set(true);
    this.loadingDetail.set(true);
    this.taskService.getTaskDetail(this.task.id).subscribe((detail) => {
      this.detail.set(detail);
      this.loadingDetail.set(false);
    });
  }

  onHoverEnd(): void {
    this.isOpen.set(false);
    // Keep the detail content mounted through the close transition (see
    // task-card__detail-wrap in the template) - clearing it immediately would
    // unmount the content and make the collapse animation snap instead of ease.
    this.closeTimeout = setTimeout(() => {
      this.detail.set(null);
      this.loadingDetail.set(false);
    }, 300);
  }

  complete(): void {
    if (this.completing()) return;
    this.completing.set(true);
    this.taskService.completeTask(this.task.id).subscribe({
      next: () => {
        this.completing.set(false);
        this.completed.emit();
      },
      error: () => this.completing.set(false)
    });
  }

  formattedDueDate(): string | null {
    if (!this.task.dueDate) return null;
    // dueDate is a date-only value stored as UTC midnight - read UTC parts
    // so the displayed day doesn't shift backward in timezones behind UTC.
    const d = new Date(this.task.dueDate);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  }
}
