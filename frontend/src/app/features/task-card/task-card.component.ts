import { Component, ElementRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
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
import { TaskCompletionAnimationService } from '../../core/services/task-completion-animation.service';
import { FrequencyPieComponent } from './frequency-pie.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [ReactiveFormsModule, FrequencyPieComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  host: {
    '[class.is-leaving]': 'leaving()'
  }
})
export class TaskCardComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private taskRefresh = inject(TaskRefreshService);
  private completionAnimation = inject(TaskCompletionAnimationService);
  private elementRef = inject(ElementRef<HTMLElement>);

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
  leaving = signal(false);
  private closeTimeout?: ReturnType<typeof setTimeout>;
  private completeErrorTimeout?: ReturnType<typeof setTimeout>;

  editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    why: [''],
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
          this.playLeaveAnimation(origin);
        } else {
          this.completed.emit();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.completing.set(false);
        this.completeError.set(err.status === 409 ? err.error?.error ?? 'Already completed today' : 'Could not complete task - try again');
        this.completeErrorTimeout = setTimeout(() => this.completeError.set(null), 4000);
      }
    });
  }

  /**
   * Plays the "leaving the list" sequence: the whole card shrinks and slides toward
   * the Completed Today panel while a glowing checkmark flies from the Complete
   * button to the same spot. `completed` (which triggers the actual list/panel
   * refresh via TaskRefreshService) only fires once the flight lands naturally, so
   * the Completed Today panel updates in step with the animation instead of jumping
   * ahead of it while the backend request has already resolved.
   *
   * The card is pinned to `position: fixed` at its current on-screen spot before the
   * shrink starts, which pulls it out of the list's flex flow immediately - sibling
   * tasks shift up on the next frame rather than waiting on the (slower) shrink/fly
   * transition to finish.
   *
   * Only one flight plays at a time app-wide (see TaskCompletionAnimationService). If
   * another task is completed before this one lands, this flight is force-finished
   * (skipped) immediately: its ghost is torn down without ever emitting `completed`,
   * so the Completed Today panel doesn't update this task's row until some other
   * completion lands and refreshes everything - it never shows a task before its own
   * animation caught up. The card itself keeps shrinking via its own CSS transition
   * regardless, since `leaving` was already set.
   */
  private playLeaveAnimation(origin: HTMLElement): void {
    const hostEl = this.elementRef.nativeElement;
    const cardRect = hostEl.getBoundingClientRect();
    const targetRect = this.completionAnimation.getTargetRect();
    const targetX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 150;
    const targetY = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight - 30;

    hostEl.style.position = 'fixed';
    hostEl.style.top = `${cardRect.top}px`;
    hostEl.style.left = `${cardRect.left}px`;
    hostEl.style.width = `${cardRect.width}px`;
    hostEl.style.margin = '0';

    hostEl.style.setProperty('--leave-dx', `${targetX - (cardRect.left + cardRect.width / 2)}px`);
    hostEl.style.setProperty('--leave-dy', `${targetY - (cardRect.top + cardRect.height / 2)}px`);
    this.leaving.set(true);

    const btnRect = origin.getBoundingClientRect();
    const originX = btnRect.left + btnRect.width / 2;
    const originY = btnRect.top + btnRect.height / 2;

    const ghost = document.createElement('div');
    ghost.className = 'task-complete-ghost';
    ghost.textContent = '✓';
    ghost.style.left = `${originX}px`;
    ghost.style.top = `${originY}px`;
    ghost.style.setProperty('--dx', `${targetX - originX}px`);
    ghost.style.setProperty('--dy', `${targetY - originY}px`);
    document.body.appendChild(ghost);

    let landTimeout: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(landTimeout);
      ghost.remove();
    };

    this.completionAnimation.claim(cleanup);

    requestAnimationFrame(() => ghost.classList.add('is-flying'));
    landTimeout = setTimeout(() => {
      cleanup();
      this.completionAnimation.clear(cleanup);
      this.completed.emit();
    }, 700);
  }

  startEdit(): void {
    this.editForm.reset({
      title: this.task.title,
      description: this.task.description,
      why: this.task.why,
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
        why: value.why,
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
