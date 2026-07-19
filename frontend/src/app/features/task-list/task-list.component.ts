import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../core/models/task.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskCardComponent],
  template: `
    <div class="task-list">
      @for (task of tasks; track task.id) {
        <app-task-card [task]="task" [showLength]="showLength" (completed)="completed.emit()"></app-task-card>
      }
    </div>
  `,
  styles: [
    `
      .task-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    `
  ]
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Input() showLength = false;
  @Output() completed = new EventEmitter<void>();
}
