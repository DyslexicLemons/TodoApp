import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { CategoryTasks, NewTask, Task, TaskDetail, TaskLength } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  getTasksByLength(length: TaskLength): Observable<CategoryTasks> {
    return this.http.get<CategoryTasks>(`${API_BASE_URL}/tasks`, { params: { length } });
  }

  getSuggestions(): Observable<CategoryTasks> {
    return this.http.get<CategoryTasks>(`${API_BASE_URL}/tasks/suggestions`);
  }

  getCompletedTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_BASE_URL}/tasks/completed`);
  }

  getTaskDetail(id: string): Observable<TaskDetail> {
    return this.http.get<TaskDetail>(`${API_BASE_URL}/tasks/${id}`);
  }

  createTask(task: NewTask): Observable<Task> {
    return this.http.post<Task>(`${API_BASE_URL}/tasks`, task);
  }

  completeTask(id: string): Observable<Task> {
    return this.http.post<Task>(`${API_BASE_URL}/tasks/${id}/complete`, {});
  }
}
