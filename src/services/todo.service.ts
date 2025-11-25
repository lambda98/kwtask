
import { Injectable, signal, effect } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Todo } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly storageKey = 'kwtask-todos';
  todos = signal<Todo[]>([]);

  constructor() {
    this.loadFromLocalStorage();

    effect(() => {
      this.saveToLocalStorage(this.todos());
    });
  }

  private loadFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      const storedTodos = localStorage.getItem(this.storageKey);
      if (storedTodos) {
        this.todos.set(JSON.parse(storedTodos));
      }
    }
  }

  private saveToLocalStorage(todos: Todo[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(todos));
    }
  }

  addTodo(title: string, dueDate?: string) {
    if (!title.trim()) return;
    const newTodo: Todo = {
      id: self.crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      dueDate: dueDate
    };
    this.todos.update(todos => [...todos, newTodo]);
  }

  deleteTodo(id: string) {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }

  updateTodo(id: string, updatedTitle: string, updatedDueDate?: string) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, title: updatedTitle.trim(), dueDate: updatedDueDate } : todo
      )
    );
  }

  toggleTodo(id: string) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  reorderTodos(event: CdkDragDrop<Todo[]>) {
    const updatedTodos = [...this.todos()];
    moveItemInArray(updatedTodos, event.previousIndex, event.currentIndex);
    this.todos.set(updatedTodos);
  }

  exportTasksToJson() {
    const dataStr = JSON.stringify(this.todos(), null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'kwtasks.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  importTasksFromJson(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedTodos = JSON.parse(text) as Todo[];
        // Basic validation
        if (Array.isArray(importedTodos) && importedTodos.every(item => 'id' in item && 'title' in item && 'completed' in item)) {
          this.todos.set(importedTodos);
        } else {
          alert('Invalid JSON file format.');
        }
      } catch (error) {
        alert('Error reading or parsing JSON file.');
        console.error('Import error:', error);
      }
    };
    reader.onerror = () => {
       alert('Error reading file.');
    };
    reader.readAsText(file);
  }
}
