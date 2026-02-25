# CLAUDE.md — KWtask

This file provides guidance for AI assistants working in this codebase.

## Project Overview

**KWtask** is a modern, password-protected To-Do list (task management) application built with Angular 21 and Tailwind CSS. It features dark/light mode, drag-and-drop reordering, JSON import/export, and LocalStorage persistence.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, zoneless) |
| Language | TypeScript ~5.8.2 |
| Styling | Tailwind CSS (latest, via CDN) |
| Icons | Font Awesome 6.5.2 (via CDN) |
| Drag-Drop | Angular CDK |
| Reactivity | Angular Signals + RxJS ^7.8.2 |
| Build | Angular CLI / `@angular/build` |
| Dev server | `ng serve` (port 3000) |

## Directory Structure

```
kwtask/
├── src/
│   ├── app.component.ts          # Root component — todo list, auth, theming
│   ├── app.component.html        # Root template
│   ├── components/
│   │   └── login/
│   │       ├── login.component.ts    # Password-protected login screen
│   │       └── login.component.html  # Login template
│   ├── models/
│   │   └── todo.model.ts         # Todo interface definition
│   └── services/
│       ├── auth.service.ts       # Authentication (sessionStorage)
│       ├── theme.service.ts      # Dark/light theme (localStorage)
│       └── todo.service.ts       # Todo CRUD + persistence (localStorage)
├── index.tsx                     # Angular bootstrap entry point
├── index.html                    # HTML root with CDN imports & Tailwind config
├── angular.json                  # Angular CLI project configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # NPM dependencies and scripts
├── metadata.json                 # App metadata (name, description)
└── README.md                     # Basic setup instructions
```

## Development Workflow

### Setup

```bash
npm install
npm run dev        # Start dev server at http://localhost:3000
```

### Available Scripts

```bash
npm run dev        # Development server (ng serve)
npm run build      # Production build → ./dist
npm run preview    # Production preview (ng serve --configuration=production)
```

### No Test Suite

There is currently **no test framework configured** — no Jest, Jasmine, spec files, or testing scripts. Do not add test stubs or test-specific boilerplate unless explicitly asked.

### No Linting/Formatting Config

There is no ESLint, Prettier, or Stylelint configuration. Follow the existing code style when making changes.

## Key Conventions

### Angular Architecture

- **Standalone components** — no `NgModule`. Every component uses `standalone: true`.
- **Zoneless change detection** — the app bootstraps with `provideExperimentalZonelessChangeDetection()`. Use `OnPush` change detection and **never** rely on Zone.js-triggered re-renders.
- **Signals** — prefer Angular Signals (`signal()`, `computed()`) for reactive state rather than `BehaviorSubject` or plain properties.
- **OnPush everywhere** — all components use `ChangeDetectionStrategy.OnPush`.

### State Management

State lives in injectable services using Angular Signals:

| Service | Signal | Storage |
|---|---|---|
| `TodoService` | `todos` signal | `localStorage` key `kwtask-todos` |
| `AuthService` | `isAuthenticated` signal | `sessionStorage` key `authenticated` |
| `ThemeService` | `isDark` signal | `localStorage` key `theme` |

### Styling Conventions

- Use **Tailwind utility classes** directly in templates.
- A custom green `primary-*` color palette is defined in `index.html` under the Tailwind `theme.extend.colors` block. Use `primary-500`, `primary-600`, etc. for brand colors.
- Dark mode classes (`dark:`) are toggled by adding/removing the `dark` class on `<html>` (managed by `ThemeService`).
- Avoid writing component-level CSS files unless absolutely required; style via Tailwind classes in templates.

### UUID Generation

Use the Web Crypto API for generating IDs:

```typescript
const id = self.crypto.randomUUID();
```

Do **not** add a UUID library dependency.

### Module Imports (CDN-based)

Third-party libraries that are loaded via the `<script type="importmap">` in `index.html` (e.g., Angular packages) must be referenced by their bare specifier — do not add them as bundled imports from `node_modules` unless the importmap is updated accordingly.

### TypeScript Config Notes

- `"target": "ES2022"`, `"module": "ESNext"` — modern syntax is fine.
- Path alias `@/*` resolves to the project root.
- `experimentalDecorators` is enabled.

## Data Model

```typescript
// src/models/todo.model.ts
export interface Todo {
  id: string;          // UUID from crypto.randomUUID()
  title: string;
  completed: boolean;
  dueDate?: string;    // Optional ISO date string
}
```

## Authentication

- Login is password-protected. The hardcoded password is stored in `AuthService` and `LoginComponent`.
- Session is tracked in `sessionStorage`; refreshing the page requires re-login.
- The `AppComponent` checks `authService.isAuthenticated()` (a signal) to decide whether to render the login view or the main todo view.

## Common Tasks

### Adding a new feature to the todo model

1. Update `src/models/todo.model.ts`.
2. Update `TodoService` to handle the new field in CRUD operations and the JSON serialization/deserialization used by import/export.
3. Update the `AppComponent` template to render/edit the new field.

### Adding a new service

Create the service file under `src/services/`, use `@Injectable({ providedIn: 'root' })`, and use Angular Signals for reactive state.

### Modifying the color theme

The Tailwind `primary` color palette is defined inline in `index.html`:

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: { 50: '...', ..., 900: '...' }
        }
      }
    }
  }
</script>
```

Edit this block to change the brand colors globally.

## Build Output

Production build outputs to `./dist/`. This directory is gitignored.

## Notes for AI Assistants

- Read source files before proposing changes — the codebase is small and fully readable.
- Keep changes minimal and focused; avoid adding unnecessary abstractions.
- Do not add a test framework, linter, or formatter unless explicitly requested.
- Do not add new npm dependencies without a clear need; prefer using existing Angular/CDK APIs and Web APIs.
- Maintain the zoneless + signals pattern; do not introduce Zone.js-dependent patterns.
- The UI has bilingual text (English/Thai); preserve both when modifying templates.
