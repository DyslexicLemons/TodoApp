import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { DIFFICULTIES, Difficulty, TASK_CATEGORIES, TASK_LENGTHS, TaskCategory, TaskLength } from '../../core/models/task.model';

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

  readonly difficulties = DIFFICULTIES;
  readonly lengths = TASK_LENGTHS;
  readonly categories = TASK_CATEGORIES;

  submitting = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
    difficulty: ['Easy', Validators.required],
    length: ['Quick', Validators.required],
    category: ['Health', Validators.required],
    isMustDo: [false]
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    const value = this.form.getRawValue();
    this.taskService
      .createTask({
        ...value,
        difficulty: value.difficulty as Difficulty,
        length: value.length as TaskLength,
        category: value.category as TaskCategory,
        dueDate: value.dueDate || null
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
