import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { TASK_CATEGORIES, TASK_FREQUENCIES, TaskCategory, TaskFrequency } from '../../core/models/task.model';

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-modal.component.html',
  styleUrl: './add-task-modal.component.scss'
})
export class AddTaskModalComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  readonly categories = TASK_CATEGORIES;
  readonly frequencies = TASK_FREQUENCIES;

  submitting = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
    estimatedHours: [0, [Validators.required, Validators.min(0)]],
    estimatedMins: [30, [Validators.required, Validators.min(0), Validators.max(59)]],
    category: ['Health', Validators.required],
    isMustDo: [false],
    frequency: ['Daily' as TaskFrequency, Validators.required],
    targetCount: [1, [Validators.required, Validators.min(1)]]
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    const value = this.form.getRawValue();
    const estimatedMinutes = value.estimatedHours * 60 + value.estimatedMins;
    if (estimatedMinutes < 1) return;

    this.submitting.set(true);
    this.taskService
      .createTask({
        title: value.title,
        description: value.description,
        dueDate: value.dueDate || null,
        estimatedMinutes,
        category: value.category as TaskCategory,
        isMustDo: value.isMustDo,
        frequency: value.frequency as TaskFrequency,
        targetCount: value.frequency === 'Weekly' ? value.targetCount : 1
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.created.emit();
        },
        error: () => this.submitting.set(false)
      });
  }
}
