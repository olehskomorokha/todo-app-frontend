import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, retry } from 'rxjs';
import { Auth } from '../auth/auth';
import { TaskGroup, TaskList, TaskNavigation, TodoTask } from '../tasks/task-navigation';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  readonly groups = signal<TaskGroup[]>([]);
  readonly lists = signal<TaskList[]>([]);
  tasks: TodoTask[] = [];
  selectedListId: number | null = null;
  selectedTitle = 'Оберіть список завдань';
  loadingTasks = false;
  loadingGroups = false;
  groupErrorMessage = '';
  draggedList: TaskList | null = null;
  dragOverGroupId: number | null = null;
  saving = false;
  errorMessage = '';
  successMessage = '';
  newGroupName = '';
  newListName = '';
  newListGroupId: number | null = null;
  editingGroupId: number | null = null;
  editingListId: number | null = null;
  editName = '';

  constructor(
    private readonly auth: Auth,
    private readonly navigation: TaskNavigation,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadNavigation();
  }

  loadNavigation(): void {
    const userId = this.auth.getUserId();
    if (userId === null) {
      this.groupErrorMessage = 'Не вдалося визначити UserId із токена.';
      return;
    }

    this.loadingGroups = true;
    this.groupErrorMessage = '';
    this.navigation.getUserGroups(userId).pipe(
      retry({ count: 2, delay: 1000 }),
      finalize(() => {
        this.loadingGroups = false;
        this.changeDetector.detectChanges();
      }),
    ).subscribe({
      next: groups => {
        this.groups.set([...groups].sort((a, b) => b.id - a.id));
        this.removeGroupedDuplicates();
      },
      error: error => {
        this.groups.set([]);
        this.groupErrorMessage = error.status === 0
          ? 'Не вдалося підключитися до API та завантажити групи.'
          : `Не вдалося завантажити групи (помилка ${error.status}).`;
        this.changeDetector.detectChanges();
      },
    });

    this.navigation.getLists().subscribe({
      next: lists => {
        this.lists.set(lists.filter(list => list.userId === userId));
        this.removeGroupedDuplicates();
      },
      error: () => {
        this.errorMessage = 'Не вдалося завантажити списки завдань.';
        this.changeDetector.detectChanges();
      },
    });
  }

  private removeGroupedDuplicates(): void {
    const groupedListIds = new Set(
      this.groups().flatMap(group => group.taskLists.map(list => list.id)),
    );
    this.lists.update(lists => lists.filter(list => !groupedListIds.has(list.id)));
  }

  listsForGroup(groupId: number | null): TaskList[] {
    if (groupId !== null) {
      const nestedLists = this.groups().find(group => group.id === groupId)?.taskLists;
      return nestedLists ?? this.lists().filter(list => list.taskGroupId === groupId);
    }
    return this.lists().filter(list => list.taskGroupId === groupId);
  }

  createGroup(): void {
    const name = this.newGroupName.trim();
    const userId = this.auth.getUserId();
    if (!name || userId === null || this.saving) return;

    this.saving = true;
    this.clearMessages();
    this.navigation.createGroup(name, userId).pipe(
      finalize(() => this.finishSaving()),
    ).subscribe({
      next: () => {
        this.newGroupName = '';
        this.successMessage = `Групу «${name}» створено.`;
        this.refreshComponentData();
      },
      error: error => this.showMutationError(error, 'Не вдалося створити групу.'),
    });
  }

  createList(): void {
    const name = this.newListName.trim();
    const userId = this.auth.getUserId();
    if (!name || userId === null || this.saving) return;

    this.saving = true;
    this.clearMessages();
    this.navigation.createList({ name, userId, taskGroupId: this.newListGroupId }).pipe(
      finalize(() => this.finishSaving()),
    ).subscribe({
      next: () => {
        this.newListName = '';
        this.newListGroupId = null;
        this.successMessage = `Список «${name}» створено.`;
        this.refreshComponentData();
      },
      error: error => this.showMutationError(error, 'Не вдалося створити список.'),
    });
  }

  startGroupEdit(group: TaskGroup): void {
    this.editingListId = null;
    this.editingGroupId = group.id;
    this.editName = group.name;
  }

  startListEdit(list: TaskList): void {
    this.editingGroupId = null;
    this.editingListId = list.id;
    this.editName = list.name;
  }

  saveGroup(group: TaskGroup): void {
    const name = this.editName.trim();
    if (!name || this.saving) return;
    this.saving = true;
    this.clearMessages();
    this.navigation.updateGroup(group.id, name).pipe(
      finalize(() => this.finishSaving()),
    ).subscribe({
      next: () => {
        this.cancelEdit();
        this.successMessage = `Групу перейменовано на «${name}».`;
        this.refreshComponentData();
      },
      error: error => this.showMutationError(error, 'Не вдалося перейменувати групу.'),
    });
  }

  saveList(list: TaskList): void {
    const name = this.editName.trim();
    if (!name || this.saving) return;
    this.saving = true;
    this.clearMessages();
    this.navigation.updateList(list.id, { name }).pipe(
      finalize(() => this.finishSaving()),
    ).subscribe({
      next: () => {
        this.cancelEdit();
        this.successMessage = `Список перейменовано на «${name}».`;
        if (this.selectedListId === list.id) this.selectedTitle = name;
        this.refreshComponentData();
      },
      error: error => this.showMutationError(error, 'Не вдалося перейменувати список.'),
    });
  }

  deleteList(list: TaskList): void {
    if (!confirm(`Видалити список «${list.name}»?`) || this.saving) return;
    this.saving = true;
    this.clearMessages();
    this.navigation.deleteList(list.id).pipe(
      finalize(() => this.finishSaving()),
    ).subscribe({
      next: () => {
        this.successMessage = `Список «${list.name}» видалено.`;
        if (this.selectedListId === list.id) {
          this.selectedListId = null;
          this.selectedTitle = 'Оберіть список завдань';
          this.tasks = [];
        }
        this.refreshComponentData();
      },
      error: error => this.showMutationError(error, 'Не вдалося видалити список.'),
    });
  }

  cancelEdit(): void {
    this.editingGroupId = null;
    this.editingListId = null;
    this.editName = '';
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private refreshComponentData(): void {
    this.loadNavigation();

    const userId = this.auth.getUserId();
    if (userId !== null && this.selectedListId !== null) {
      this.loadTasksRequest(
        this.navigation.getUserTasksByList(userId, this.selectedListId),
      );
    }

    this.changeDetector.detectChanges();
  }

  private finishSaving(): void {
    this.saving = false;
    this.changeDetector.detectChanges();
  }

  private showMutationError(error: any, fallback: string): void {
    this.errorMessage = error.error?.message ?? fallback;
    this.changeDetector.detectChanges();
  }

  startDragging(list: TaskList, event: DragEvent): void {
    this.draggedList = list;
    event.dataTransfer?.setData('text/plain', String(list.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowGroupDrop(groupId: number, event: DragEvent): void {
    event.preventDefault();
    this.dragOverGroupId = groupId;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  leaveGroup(groupId: number): void {
    if (this.dragOverGroupId === groupId) this.dragOverGroupId = null;
  }

  dropIntoGroup(group: TaskGroup, event: DragEvent): void {
    event.preventDefault();
    const list = this.draggedList;
    this.draggedList = null;
    this.dragOverGroupId = null;

    if (!list || list.taskGroupId === group.id || this.saving) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.navigation.updateList(list.id, { taskGroupId: group.id }).pipe(
      finalize(() => (this.saving = false)),
    ).subscribe({
      next: () => {
        this.successMessage = `Список «${list.name}» додано до групи «${group.name}».`;
        this.refreshComponentData();
      },
      error: error => {
        this.errorMessage = error.error?.message ?? 'Не вдалося перемістити список до групи.';
      },
    });
  }

  finishDragging(): void {
    this.draggedList = null;
    this.dragOverGroupId = null;
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
    request.pipe(finalize(() => {
      this.loadingTasks = false;
      this.changeDetector.detectChanges();
    })).subscribe({
      next: tasks => {
        this.tasks = tasks;
        this.changeDetector.detectChanges();
      },
      error: error => {
        this.tasks = [];
        this.errorMessage = error.error?.message ?? 'Не вдалося завантажити завдання.';
        this.changeDetector.detectChanges();
      },
    });
  }

}
