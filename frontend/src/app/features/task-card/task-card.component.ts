import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Task, TaskDetail } from '../../core/models/task.model';
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

  detail = signal<TaskDetail | null>(null);
  loadingDetail = signal(false);
  completing = signal(false);

  onHoverStart(): void {
    this.loadingDetail.set(true);
    this.taskService.getTaskDetail(this.task.id).subscribe((detail) => {
      this.detail.set(detail);
      this.loadingDetail.set(false);
    });
  }

  onHoverEnd(): void {
    this.detail.set(null);
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
