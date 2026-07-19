import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { MonthlyDashboard, MonthOption, WeekdayMatrixResponse } from '../models/history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private http = inject(HttpClient);

  getAvailableMonths(): Observable<{ months: MonthOption[] }> {
    return this.http.get<{ months: MonthOption[] }>(`${API_BASE_URL}/history/months`);
  }

  getMonthlyDashboard(year: number, month: number): Observable<MonthlyDashboard> {
    return this.http.get<MonthlyDashboard>(`${API_BASE_URL}/history/monthly`, {
      params: { year, month }
    });
  }

  getWeekdayMatrix(): Observable<WeekdayMatrixResponse> {
    return this.http.get<WeekdayMatrixResponse>(`${API_BASE_URL}/history/weekday-matrix`);
  }
}
