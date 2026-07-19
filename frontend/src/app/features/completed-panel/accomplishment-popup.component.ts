import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Task } from '../../core/models/task.model';

const POPUP_WIDTH = 220;
const VIEWPORT_MARGIN = 8;

@Component({
  selector: 'app-accomplishment-popup',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './accomplishment-popup.component.html',
  styleUrl: './accomplishment-popup.component.scss'
})
export class AccomplishmentPopupComponent {
  @Input({ required: true }) task!: Task;
  @Input({ required: true }) anchorRect!: DOMRect;

  get style(): Record<string, string> {
    const rect = this.anchorRect;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.right - POPUP_WIDTH, window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN)
    );
    const bottom = Math.min(window.innerHeight - rect.top + VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN);

    return {
      left: `${left}px`,
      bottom: `${bottom}px`
    };
  }

  encouragement(): string {
    const streak = this.task.currentStreak;
    if (streak >= 10) return "You're unstoppable! This streak is a volcano.";
    if (streak >= 5) return 'On fire! Keep the streak alive.';
    if (streak > 1) return 'Nice work - the streak is building.';
    return 'Great start - come back tomorrow to build a streak!';
  }
}
