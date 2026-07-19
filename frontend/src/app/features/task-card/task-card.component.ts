import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TASK_CATEGORIES,
  TASK_FREQUENCIES,
  Task,
  TaskCategory,
  TaskDetail,
  TaskFrequency,
  categoryToEmoji,
  completionsInCurrentPeriod,
  formatEstimatedTime,
  isDoneForCurrentPeriod,
  lengthToSlug
} from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { FrequencyPieComponent } from './frequency-pie.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [ReactiveFormsModule, FrequencyPieComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private taskRefresh = inject(TaskRefreshService);

  @Input({ required: true }) task!: Task;
  @Output() completed = new EventEmitter<void>();

  formatEstimatedTime = formatEstimatedTime;
  categoryToEmoji = categoryToEmoji;
  lengthToSlug = lengthToSlug;
  readonly categories = TASK_CATEGORIES;
  readonly frequencies = TASK_FREQUENCIES;

  detail = signal<TaskDetail | null>(null);
  loadingDetail = signal(false);
  completing = signal(false);
  completeError = signal<string | null>(null);
  isOpen = signal(false);
  hovering = signal(false);
  editing = signal(false);
  savingEdit = signal(false);
  confirmingDelete = signal(false);
  deleting = signal(false);
  deleteError = signal<string | null>(null);
  private closeTimeout?: ReturnType<typeof setTimeout>;
  private completeErrorTimeout?: ReturnType<typeof setTimeout>;

  editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
    category: ['Health' as TaskCategory, Validators.required],
    estimatedHours: [0, [Validators.required, Validators.min(0)]],
    estimatedMins: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    isMustDo: [false],
    frequency: ['Daily' as TaskFrequency, Validators.required],
    targetCount: [1, [Validators.required, Validators.min(1)]]
  });

  get periodProgress(): { completed: number; target: number; label: string } | null {
    if (this.task.frequency !== 'Weekly' && this.task.frequency !== 'Monthly') return null;
    const target = this.task.frequency === 'Monthly' ? 1 : this.task.targetCount;
    const completedCount = completionsInCurrentPeriod(this.task);
    const periodWord = this.task.frequency === 'Weekly' ? 'week' : 'month';
    return { completed: completedCount, target, label: `${completedCount} of ${target} this ${periodWord}` };
  }

  onHoverStart(): void {
    clearTimeout(this.closeTimeout);
    this.hovering.set(true);
    this.isOpen.set(true);
    this.refreshDetail();
  }

  onHoverEnd(): void {
    this.hovering.set(false);
    if (this.editing() || this.confirmingDelete()) return;
    this.maybeClose();
  }

  private refreshDetail(): void {
    this.loadingDetail.set(true);
    this.taskService.getTaskDetail(this.task.id).subscribe((detail) => {
      this.detail.set(detail);
      this.loadingDetail.set(false);
    });
  }

  private maybeClose(): void {
    if (this.hovering()) return;
    this.isOpen.set(false);
    // Keep the detail content mounted through the close transition (see
    // task-card__detail-wrap in the template) - clearing it immediately would
    // unmount the content and make the collapse animation snap instead of ease.
    this.closeTimeout = setTimeout(() => {
      this.detail.set(null);
      this.loadingDetail.set(false);
    }, 300);
  }

  onCompleteClick(event: MouseEvent): void {
    if (this.completing()) return;
    this.complete(event.currentTarget as HTMLElement);
  }

  complete(origin: HTMLElement): void {
    if (this.completing()) return;
    this.completing.set(true);
    clearTimeout(this.completeErrorTimeout);
    this.completeError.set(null);
    this.taskService.completeTask(this.task.id).subscribe({
      next: (updatedTask) => {
        this.completing.set(false);
        // Only play the "leaving the list" animation once the task is actually
        // done for its period - a Weekly task with targetCount > 1 rightly stays
        // in must-do after a single completion, and shouldn't look like it left.
        if (isDoneForCurrentPeriod(updatedTask)) {
          this.launchCompletionFly(origin);
        }
        this.completed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.completing.set(false);
        this.completeError.set(err.status === 409 ? err.error?.error ?? 'Already completed today' : 'Could not complete task - try again');
        this.completeErrorTimeout = setTimeout(() => this.completeError.set(null), 4000);
      }
    });
  }

  /**
   * Sends a little glowing checkmark flying from the Complete button toward the
   * bottom-right corner, where the Completed Today panel lives - purely decorative,
   * independent of the actual completion request.
   */
  private launchCompletionFly(origin: HTMLElement): void {
    const rect = origin.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const targetX = window.innerWidth - 150;
    const targetY = window.innerHeight - 30;

    const ghost = document.createElement('div');
    ghost.className = 'task-complete-ghost';
    ghost.textContent = '✓';
    ghost.style.left = `${originX}px`;
    ghost.style.top = `${originY}px`;
    ghost.style.setProperty('--dx', `${targetX - originX}px`);
    ghost.style.setProperty('--dy', `${targetY - originY}px`);
    document.body.appendChild(ghost);

    requestAnimationFrame(() => ghost.classList.add('is-flying'));
    setTimeout(() => ghost.remove(), 800);
  }

  startEdit(): void {
    this.editForm.reset({
      title: this.task.title,
      description: this.task.description,
      dueDate: this.formattedDueDateForInput(),
      category: this.task.category,
      estimatedHours: Math.floor(this.task.estimatedMinutes / 60),
      estimatedMins: this.task.estimatedMinutes % 60,
      isMustDo: this.task.isMustDo,
      frequency: this.task.frequency,
      targetCount: this.task.targetCount
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.maybeClose();
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.savingEdit()) return;
    const value = this.editForm.getRawValue();
    const estimatedMinutes = value.estimatedHours * 60 + value.estimatedMins;
    if (estimatedMinutes < 1) return;

    this.savingEdit.set(true);
    this.taskService
      .updateTask(this.task.id, {
        title: value.title,
        description: value.description,
        dueDate: value.dueDate || null,
        category: value.category as TaskCategory,
        estimatedMinutes,
        isMustDo: value.isMustDo,
        frequency: value.frequency as TaskFrequency,
        targetCount: value.frequency === 'Weekly' ? value.targetCount : 1
      })
      .subscribe({
        next: () => {
          this.savingEdit.set(false);
          this.editing.set(false);
          this.refreshDetail();
          this.taskRefresh.notify();
          this.maybeClose();
        },
        error: () => this.savingEdit.set(false)
      });
  }

  requestDelete(): void {
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
    this.maybeClose();
  }

  confirmDelete(): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.taskRefresh.notify();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteError.set('Could not delete task - try again');
      }
    });
  }

  formattedDueDate(): string | null {
    if (!this.task.dueDate) return null;
    // dueDate is a date-only value stored as UTC midnight - read UTC parts
    // so the displayed day doesn't shift backward in timezones behind UTC.
    const d = new Date(this.task.dueDate);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  }

  private formattedDueDateForInput(): string {
    if (!this.task.dueDate) return '';
    // Same UTC-read rationale as formattedDueDate, formatted for <input type="date">.
    const d = new Date(this.task.dueDate);
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${d.getUTCFullYear()}-${month}-${day}`;
  }
}
