
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Todo } from './models/todo.model';
import { AuthService } from './services/auth.service';
import { TodoService } from './services/todo.service';
import { ThemeService } from './services/theme.service';
import { LoginComponent } from './components/login/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DragDropModule, LoginComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  authService = inject(AuthService);
  todoService = inject(TodoService);
  themeService = inject(ThemeService);

  newTodoTitle = signal('');
  newTodoDueDate = signal('');
  editingTodoId = signal<string | null>(null);
  editingTodoTitle = signal('');
  editingTodoDueDate = signal('');
  showTestInstructions = signal(false);

  todos = this.todoService.todos;
  isAuthenticated = this.authService.isAuthenticated;
  currentTheme = this.themeService.theme;

  filteredTodos = computed(() => {
    const allTodos = this.todos();
    const completed = allTodos.filter(t => t.completed);
    const incomplete = allTodos.filter(t => !t.completed);
    return [...incomplete, ...completed];
  });
  
  // Method to handle file input for JSON import
  triggerImport() {
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/json') {
        this.todoService.importTasksFromJson(file);
      } else {
        alert('Please select a valid JSON file.');
      }
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }


  addTodo() {
    this.todoService.addTodo(this.newTodoTitle(), this.newTodoDueDate());
    this.newTodoTitle.set('');
    this.newTodoDueDate.set('');
  }

  deleteTodo(id: string) {
    this.todoService.deleteTodo(id);
  }

  toggleTodo(id: string) {
    this.todoService.toggleTodo(id);
  }
  
  drop(event: CdkDragDrop<Todo[]>) {
    this.todoService.reorderTodos(event);
  }

  enterEditMode(todo: Todo) {
    this.editingTodoId.set(todo.id);
    this.editingTodoTitle.set(todo.title);
    this.editingTodoDueDate.set(todo.dueDate || '');
  }

  saveEdit() {
    const id = this.editingTodoId();
    if (id) {
      this.todoService.updateTodo(id, this.editingTodoTitle(), this.editingTodoDueDate());
      this.cancelEdit();
    }
  }

  cancelEdit() {
    this.editingTodoId.set(null);
    this.editingTodoTitle.set('');
    this.editingTodoDueDate.set('');
  }

  formatDateForInput(isoDate?: string): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return '';
      // Format to YYYY-MM-DDTHH:mm
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
