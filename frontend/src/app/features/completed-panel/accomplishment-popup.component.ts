import { Component, Input } from '@angular/core';
import { Task } from '../../core/models/task.model';

@Component({
  selector: 'app-accomplishment-popup',
  standalone: true,
  templateUrl: './accomplishment-popup.component.html',
  styleUrl: './accomplishment-popup.component.scss'
})
export class AccomplishmentPopupComponent {
  @Input({ required: true }) task!: Task;

  encouragement(): string {
    const streak = this.task.currentStreak;
    if (streak >= 10) return "You're unstoppable! This streak is a volcano.";
    if (streak >= 5) return 'On fire! Keep the streak alive.';
    if (streak > 1) return 'Nice work - the streak is building.';
    return 'Great start - come back tomorrow to build a streak!';
  }
}
