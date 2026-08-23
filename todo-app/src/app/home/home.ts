import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../auth/auth';
import { TaskGroup, TaskList, TaskNavigation, TodoTask } from '../tasks/task-navigation';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  showGroupForm = false;
  showListForm = false;
  groupName = '';
  listName = '';
  listGroupId: number | null = null;
  groups: TaskGroup[] = [];
  lists: TaskList[] = [];
  tasks: TodoTask[] = [];
  selectedListId: number | null = null;
  selectedTitle = 'Усі завдання';
  loadingTasks = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly auth: Auth,
    private readonly navigation: TaskNavigation,
  ) {}

  ngOnInit(): void {
    this.loadNavigation();
    this.loadAllTasks();
  }

  loadNavigation(afterLoad?: () => void): void {
    const userId = this.auth.getUserId();
    if (userId === null) {
      this.errorMessage = 'Не вдалося визначити UserId із токена.';
      return;
    }

    this.navigation.loadForUser(userId).subscribe({
      next: data => {
        this.groups = data.groups
          .sort((a, b) => b.id - a.id);
        this.lists = data.lists.filter(list => list.userId === userId);
        afterLoad?.();
      },
      error: () => (this.errorMessage = 'Не вдалося завантажити групи та списки завдань.'),
    });
  }

  listsForGroup(groupId: number | null): TaskList[] {
    if (groupId !== null) {
      const nestedLists = this.groups.find(group => group.id === groupId)?.taskLists;
      return nestedLists ?? this.lists.filter(list => list.taskGroupId === groupId);
    }
    return this.lists.filter(list => list.taskGroupId === groupId);
  }

  loadAllTasks(): void {
    const userId = this.auth.getUserId();
    if (userId === null) return;

    this.selectedListId = null;
    this.selectedTitle = 'Усі завдання';
    this.loadTasksRequest(this.navigation.getUserTasks(userId));
  }

  selectList(list: TaskList): void {
    const userId = this.auth.getUserId();
    if (userId === null) return;

    this.selectedListId = list.id;
    this.selectedTitle = list.name;
    this.loadTasksRequest(this.navigation.getUserTasksByList(userId, list.id));
  }

  private loadTasksRequest(request: ReturnType<TaskNavigation['getUserTasks']>): void {
    this.loadingTasks = true;
    this.errorMessage = '';
    request.pipe(finalize(() => (this.loadingTasks = false))).subscribe({
      next: tasks => (this.tasks = tasks),
      error: error => {
        this.tasks = [];
        this.errorMessage = error.error?.message ?? 'Не вдалося завантажити завдання.';
      },
    });
  }

  openListForm(): void {
    this.showGroupForm = false;
    this.showListForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openGroupForm(): void {
    this.showListForm = false;
    this.showGroupForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  createList(): void {
    const name = this.listName.trim();
    const userId = this.auth.getUserId();

    if (!name || this.saving) return;
    if (userId === null) {
      this.errorMessage = 'Не вдалося визначити UserId із токена.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.navigation.createList({ name, userId, taskGroupId: this.listGroupId }).pipe(
      finalize(() => (this.saving = false)),
    ).subscribe({
      next: () => {
        const createdName = name;
        const createdGroupId = this.listGroupId;
        this.listName = '';
        this.listGroupId = null;
        this.showListForm = false;
        this.successMessage = `Список «${createdName}» успішно створено.`;
        this.loadNavigation(() => {
          const createdList = [...this.lists]
            .reverse()
            .find(list => list.name === createdName && list.taskGroupId === createdGroupId);
          if (createdList) this.selectList(createdList);
        });
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Не вдалося створити список завдань.';
      },
    });
  }

  createGroup(): void {
    const name = this.groupName.trim();
    const userId = this.auth.getUserId();

    if (!name || this.saving) return;
    if (userId === null) {
      this.errorMessage = 'Не вдалося визначити UserId із токена.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.navigation.createGroup(name, userId).pipe(
      finalize(() => (this.saving = false)),
    ).subscribe({
      next: () => {
        const createdName = name;
        this.groupName = '';
        this.showGroupForm = false;
        this.successMessage = `Групу «${createdName}» успішно створено.`;
        this.loadNavigation();
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Не вдалося створити групу.';
      },
    });
  }
}
