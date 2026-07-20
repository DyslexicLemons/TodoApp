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

  getLastModified(): Observable<{ lastModified: string | null }> {
    return this.http.get<{ lastModified: string | null }>(`${API_BASE_URL}/tasks/last-modified`);
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

  updateTask(id: string, changes: Partial<NewTask>): Observable<Task> {
    return this.http.patch<Task>(`${API_BASE_URL}/tasks/${id}`, changes);
  }

  completeTask(id: string): Observable<Task> {
    return this.http.post<Task>(`${API_BASE_URL}/tasks/${id}/complete`, {});
  }

  uncompleteTask(id: string): Observable<Task> {
    return this.http.post<Task>(`${API_BASE_URL}/tasks/${id}/uncomplete`, {});
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/tasks/${id}`);
  }
}
