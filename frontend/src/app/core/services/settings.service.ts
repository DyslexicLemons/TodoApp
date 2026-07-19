import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { AppSettings, CalendarStatus, DaySchedule } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${API_BASE_URL}/settings`);
  }

  updateSettings(workSchedule: DaySchedule[]): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${API_BASE_URL}/settings`, { workSchedule });
  }

  getCalendarStatus(): Observable<CalendarStatus> {
    return this.http.get<CalendarStatus>(`${API_BASE_URL}/calendar/status`);
  }

  getCalendarAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API_BASE_URL}/calendar/auth-url`);
  }

  disconnectCalendar(): Observable<{ connected: boolean }> {
    return this.http.post<{ connected: boolean }>(`${API_BASE_URL}/calendar/disconnect`, {});
  }
}
