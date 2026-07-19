import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { WeekPlan } from '../models/planner.model';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private http = inject(HttpClient);

  getWeekPlan(): Observable<WeekPlan> {
    return this.http.get<WeekPlan>(`${API_BASE_URL}/planner/week`);
  }
}
