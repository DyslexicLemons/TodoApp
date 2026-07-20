import { Injectable } from '@angular/core';

/**
 * Coordinates the single "task card -> Completed Today panel" completion animation.
 * Only one flight plays at a time: claiming the slot force-finishes (skips) whatever
 * flight currently holds it, so a fast second completion cuts the first one short
 * instead of the two overlapping or queueing up behind each other.
 */
@Injectable({ providedIn: 'root' })
export class TaskCompletionAnimationService {
  private targetEl: HTMLElement | null = null;
  private activeForceFinish: (() => void) | null = null;

  registerTarget(el: HTMLElement): void {
    this.targetEl = el;
  }

  unregisterTarget(el: HTMLElement): void {
    if (this.targetEl === el) this.targetEl = null;
  }

  getTargetRect(): DOMRect | null {
    return this.targetEl ? this.targetEl.getBoundingClientRect() : null;
  }

  /** Claims the flight slot, immediately skipping whichever flight currently holds it. */
  claim(forceFinish: () => void): void {
    this.activeForceFinish?.();
    this.activeForceFinish = forceFinish;
  }

  /** Call once a flight lands naturally, so a later claim doesn't re-skip it. */
  clear(forceFinish: () => void): void {
    if (this.activeForceFinish === forceFinish) {
      this.activeForceFinish = null;
    }
  }
}
