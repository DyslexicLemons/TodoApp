import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TaskRefreshService } from '../../core/services/task-refresh.service';
import { TaskCompletionAnimationService } from '../../core/services/task-completion-animation.service';
import { StreakFlameIconComponent } from './streak-flame-icon.component';
import { AccomplishmentPopupComponent } from './accomplishment-popup.component';

@Component({
  selector: 'app-completed-panel',
  standalone: true,
  imports: [StreakFlameIconComponent, AccomplishmentPopupComponent],
  templateUrl: './completed-panel.component.html',
  styleUrl: './completed-panel.component.scss'
})
export class CompletedPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  private taskService = inject(TaskService);
  private taskRefresh = inject(TaskRefreshService);
  private completionAnimation = inject(TaskCompletionAnimationService);
  private refreshSub?: Subscription;

  @ViewChild('panel', { static: true }) private panelRef!: ElementRef<HTMLElement>;

  completedTasks = signal<Task[]>([]);
  hoveredTaskId = signal<string | null>(null);
  hoveredRect = signal<DOMRect | null>(null);

  onHover(taskId: string, event: MouseEvent): void {
    this.hoveredTaskId.set(taskId);
    this.hoveredRect.set((event.currentTarget as HTMLElement).getBoundingClientRect());
  }

  onUncomplete(taskId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.taskService.uncompleteTask(taskId).subscribe(() => {
      this.hoveredTaskId.set(null);
      this.load();
      this.taskRefresh.notify();
    });
  }

  ngOnInit(): void {
    this.load();
    this.refreshSub = this.taskRefresh.onChange.subscribe(() => this.load());
  }

  ngAfterViewInit(): void {
    this.completionAnimation.registerTarget(this.panelRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.completionAnimation.unregisterTarget(this.panelRef.nativeElement);
  }

  load(): void {
    this.taskService.getCompletedTasks().subscribe((tasks) => this.completedTasks.set(tasks));
  }
}
