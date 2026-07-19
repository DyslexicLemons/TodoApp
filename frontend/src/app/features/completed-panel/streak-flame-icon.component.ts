import { Component, Input, computed, signal } from '@angular/core';
import { flameTierForStreak as sharedFlameTierForStreak } from '../../../../../shared/flameTier';

export type FlameTier = 'small' | 'big' | 'volcano';

export function flameTierForStreak(streak: number): FlameTier {
  return sharedFlameTierForStreak(streak) as FlameTier;
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
