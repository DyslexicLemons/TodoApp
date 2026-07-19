import { Component } from '@angular/core';
import { DashboardShellComponent } from './features/dashboard/dashboard-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardShellComponent],
  template: `<app-dashboard-shell></app-dashboard-shell>`
})
export class AppComponent {}
