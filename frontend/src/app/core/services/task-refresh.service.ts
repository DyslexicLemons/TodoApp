import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Cross-component signal: fires whenever a task is created or completed, so open views know to refetch. */
@Injectable({ providedIn: 'root' })
export class TaskRefreshService {
  private readonly changes$ = new Subject<void>();
  readonly onChange = this.changes$.asObservable();

  notify(): void {
    this.changes$.next();
  }
}
