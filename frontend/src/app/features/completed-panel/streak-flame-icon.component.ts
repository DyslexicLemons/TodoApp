import { Component, Input, computed, signal } from '@angular/core';

export type FlameTier = 'small' | 'big' | 'volcano';

/** Matches backend streakService.js FLAME_TIERS thresholds. */
export function flameTierForStreak(streak: number): FlameTier {
  if (streak >= 10) return 'volcano';
  if (streak >= 5) return 'big';
  return 'small';
}

@Component({
  selector: 'app-streak-flame-icon',
  standalone: true,
  templateUrl: './streak-flame-icon.component.html',
  styleUrl: './streak-flame-icon.component.scss'
})
export class StreakFlameIconComponent {
  streakValue = signal(1);

  @Input({ required: true }) set streak(value: number) {
    this.streakValue.set(value);
  }

  tier = computed<FlameTier>(() => flameTierForStreak(this.streakValue()));
}
