import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';

export interface TaskGroup {
  id: number;
  name: string;
  userId: number;
  taskListIds: number[] | null;
  taskLists: TaskList[];
}

export interface TaskList {
  id: number;
  userId: number;
  taskGroupId: number | null;
  name: string;
  createdAt: string;
}

export interface CreateTaskList {
  userId: number;
  taskGroupId: number | null;
  name: string;
}

export interface TodoTask {
  id: number;
  taskListId: number | null;
  name: string;
  description: string | null;
  isFinished: boolean;
  isImportant: boolean | null;
  dateOfCreation: string;
  deadline: string | null;
  remind: string | null;
}

export interface CreateTodoTask {
  userId: number;
  taskListId: number | null;
  name: string;
  description?: string;
  deadline?: string;
  remind?: string;
  isImportant: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskNavigation {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7225/api';

  loadAll() {
    return forkJoin({
      groups: this.http.get<TaskGroup[]>(`${this.apiUrl}/TaskGroup`),
      lists: this.http.get<TaskList[]>(`${this.apiUrl}/TaskList`),
    });
  }

  getGroups() {
    return this.http.get<TaskGroup[]>(`${this.apiUrl}/TaskGroup`);
  }

  getUserGroups(userId: number) {
    return this.http.get<TaskGroup[]>(`${this.apiUrl}/TaskGroup/user/${userId}`);
  }

  getLists() {
    return this.http.get<TaskList[]>(`${this.apiUrl}/TaskList`);
  }

  loadForUser(userId: number) {
    return forkJoin({
      groups: this.getUserGroups(userId),
      lists: this.http.get<TaskList[]>(`${this.apiUrl}/TaskList`),
    });
  }

  createGroup(name: string, userId: number) {
    return this.http.post<void>(`${this.apiUrl}/TaskGroup`, { name, userId });
  }

  updateGroup(id: number, name: string) {
    return this.http.put<void>(`${this.apiUrl}/TaskGroup/${id}`, { name });
  }

  createList(data: CreateTaskList) {
    return this.http.post<void>(`${this.apiUrl}/TaskList`, data);
  }

  updateList(id: number, data: { name?: string; taskGroupId?: number }) {
    return this.http.put<void>(`${this.apiUrl}/TaskList/${id}`, data);
  }

  deleteList(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/TaskList/${id}`);
  }

  getUserTasks(userId: number) {
    return this.http.get<TodoTask[]>(`${this.apiUrl}/Task/user/${userId}`);
  }

  getUserTasksByList(userId: number, taskListId: number) {
    return this.http.get<TodoTask[]>(
      `${this.apiUrl}/Task/user/${userId}/task-list/${taskListId}`,
    );
  }

  createTask(data: CreateTodoTask) {
    return this.http.post<void>(`${this.apiUrl}/Task`, data);
  }
}
