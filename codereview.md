# Code Review — KWtask

> วันที่รีวิว: 25 กุมภาพันธ์ 2569
> ผู้รีวิว: AI Code Review
> เวอร์ชัน: 0.0.0
> สแต็ก: Angular 21 · TypeScript 5.8 · Tailwind CSS · Angular CDK

---

## สรุปภาพรวม

KWtask เป็นแอปจัดการงาน (To-Do) ที่ออกแบบมาดี มีโครงสร้างโค้ดสะอาด และใช้ฟีเจอร์ใหม่ของ Angular 21 ได้อย่างเหมาะสม (Standalone Components, Signals, Zoneless) อย่างไรก็ตามพบปัญหาด้าน **ความปลอดภัยที่ต้องแก้ไขด่วน** และข้อควรปรับปรุงหลายจุด

| หมวด | ระดับ |
|---|---|
| ความปลอดภัย | 🔴 วิกฤต |
| คุณภาพโค้ด | 🟡 ปานกลาง |
| สถาปัตยกรรม | 🟡 ปานกลาง |
| ประสิทธิภาพ | 🟢 ดี |
| การบำรุงรักษา | 🟡 ปานกลาง |

---

## 🔴 ปัญหาวิกฤต (Critical)

### 1. รหัสผ่านถูก Hardcode ในซอร์สโค้ด

**ไฟล์:** `src/services/auth.service.ts:4` และ `src/components/login/login.component.html`

```typescript
// auth.service.ts
private readonly passwordKey = 'km@2025SD1'; // ❌ อันตรายมาก
```

**ปัญหา:** รหัสผ่านถูกฝังอยู่ใน source code และแสดงผ่านหน้า "วิธีการทดสอบ" ใน UI โดยตรง (`login.component.html` และ `app.component.html`) ทุกคนที่เปิด DevTools หรืออ่านซอร์สโค้ดจะเห็นรหัสผ่านได้ทันที

**แนวทางแก้ไข:**
```typescript
// ✅ ใช้ environment variable แทน
import { environment } from '../environments/environment';

private readonly passwordKey = environment.appPassword;
```

สร้างไฟล์ `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  appPassword: '' // ดึงจาก build-time env var หรือ config ภายนอก
};
```

---

### 2. Session Authentication ข้ามผ่านได้ง่ายมาก

**ไฟล์:** `src/services/auth.service.ts:14-18`

```typescript
// ❌ ตรวจสอบแค่ string 'true' ใน sessionStorage
const sessionValue = sessionStorage.getItem(this.sessionKey);
if (sessionValue === 'true') {
  this.isAuthenticated.set(true);
}
```

**ปัญหา:** ใครก็ตามสามารถเปิด DevTools แล้วพิมพ์ `sessionStorage.setItem('kwtask-auth', 'true')` เพื่อข้ามการล็อกอินได้ทันที

**แนวทางแก้ไข:**
```typescript
// ✅ ใช้ session token ที่สุ่มขึ้นมาและตรวจสอบผ่าน server หรืออย่างน้อยใช้ hash
private generateSessionToken(): string {
  return self.crypto.randomUUID();
}
```

> **หมายเหตุ:** สำหรับแอปพลิเคชันส่วนตัว/ภายใน ระดับความปลอดภัยนี้อาจยอมรับได้ แต่ควรเข้าใจข้อจำกัดนี้

---

## 🟠 ปัญหาสำคัญ (Major)

### 3. LoginComponent ขาด `standalone: true`

**ไฟล์:** `src/components/login/login.component.ts:4`

```typescript
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ❌ ขาด standalone: true !
})
export class LoginComponent { ... }
```

**ปัญหา:** `AppComponent` ประกาศ `standalone: true` และ import `LoginComponent` โดยตรงใน `imports: [...]` ซึ่งต้องการให้ `LoginComponent` เป็น standalone component ด้วย การขาด `standalone: true` อาจทำให้เกิด compile error หรือ runtime error ในบางสภาพแวดล้อม

**แนวทางแก้ไข:**
```typescript
@Component({
  selector: 'app-login',
  standalone: true, // ✅ เพิ่มบรรทัดนี้
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent { ... }
```

---

### 4. `@angular/cdk` ไม่มีใน `package.json`

**ไฟล์:** `package.json`

```json
// ❌ ไม่พบ @angular/cdk ใน dependencies
{
  "dependencies": {
    "@angular/core": "^21.0.0",
    // ... แต่ไม่มี @angular/cdk !
  }
}
```

**ปัญหา:** `TodoService` และ `AppComponent` ใช้ `@angular/cdk/drag-drop` แต่ไม่ได้ระบุ `@angular/cdk` เป็น dependency ทำให้การติดตั้งใหม่อาจล้มเหลว

**แนวทางแก้ไข:**
```json
{
  "dependencies": {
    "@angular/cdk": "^21.0.0"  // ✅ เพิ่ม dependency นี้
  }
}
```

---

### 5. JSON.parse ใน `loadFromLocalStorage` ไม่มี Error Handling

**ไฟล์:** `src/services/todo.service.ts:17-22`

```typescript
private loadFromLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    const storedTodos = localStorage.getItem(this.storageKey);
    if (storedTodos) {
      this.todos.set(JSON.parse(storedTodos)); // ❌ ไม่มี try-catch
    }
  }
}
```

**ปัญหา:** ถ้าข้อมูลใน localStorage เสียหาย (corrupted) หรือถูกแก้ไขโดยตรง `JSON.parse` จะ throw exception และแอปจะพัง (crash) ทันทีที่โหลด

**แนวทางแก้ไข:**
```typescript
private loadFromLocalStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    const storedTodos = localStorage.getItem(this.storageKey);
    if (storedTodos) {
      this.todos.set(JSON.parse(storedTodos));
    }
  } catch (error) {
    console.error('Failed to load todos from localStorage:', error);
    localStorage.removeItem(this.storageKey); // ✅ ล้างข้อมูลเสียหายออก
  }
}
```

---

## 🟡 ปัญหาปานกลาง (Minor)

### 6. Service บาง Properties ควรเป็น `private`

**ไฟล์:** `src/app.component.ts:11-13`

```typescript
export class AppComponent {
  authService = inject(AuthService);   // ❌ ควรเป็น protected หรือ private
  todoService = inject(TodoService);   // ❌
  themeService = inject(ThemeService); // ❌
```

**ปัญหา:** การ expose services เป็น public properties ทำให้ components อื่นหรือ tests สามารถเข้าถึงและเรียก methods โดยตรงได้ ซึ่งลด encapsulation

**แนวทางแก้ไข:**
```typescript
export class AppComponent {
  protected readonly authService = inject(AuthService);
  protected readonly todoService = inject(TodoService);
  protected readonly themeService = inject(ThemeService);
```

---

### 7. การใช้ `document.getElementById` แทน `ViewChild`

**ไฟล์:** `src/app.component.ts:32-34`

```typescript
triggerImport() {
  const fileInput = document.getElementById('import-file-input') as HTMLInputElement; // ❌
  fileInput?.click();
}
```

**ปัญหา:** การเข้าถึง DOM โดยตรงด้วย `document.getElementById` เป็น imperative pattern ที่ควรหลีกเลี่ยงใน Angular และไม่รองรับ SSR (Server-Side Rendering)

**แนวทางแก้ไข:**
```typescript
// ใน component
@ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

triggerImport() {
  this.importInput.nativeElement.click(); // ✅
}
```

```html
<!-- ใน template -->
<input #importInput type="file" class="hidden" (change)="onFileSelected($event)" accept=".json">
```

---

### 8. TodoService Coupling กับ Angular CDK

**ไฟล์:** `src/services/todo.service.ts:45-49`

```typescript
// ❌ Service รู้จัก CdkDragDrop event โดยตรง
reorderTodos(event: CdkDragDrop<Todo[]>) {
  const updatedTodos = [...this.todos()];
  moveItemInArray(updatedTodos, event.previousIndex, event.currentIndex);
  this.todos.set(updatedTodos);
}
```

**ปัญหา:** Service ควรไม่รู้จัก UI framework events การ inject dependency ของ UI library เข้าไปใน business service ทำให้ยากต่อการ test และเปลี่ยน UI library ในอนาคต

**แนวทางแก้ไข:**
```typescript
// ✅ Service รับแค่ index ที่ต้องการ
reorderTodos(previousIndex: number, currentIndex: number) {
  const updatedTodos = [...this.todos()];
  moveItemInArray(updatedTodos, previousIndex, currentIndex);
  this.todos.set(updatedTodos);
}
```

```typescript
// Component จัดการ event แล้วส่ง index ให้ service
drop(event: CdkDragDrop<Todo[]>) {
  this.todoService.reorderTodos(event.previousIndex, event.currentIndex);
}
```

---

### 9. Drag-and-Drop ขัดกับ `filteredTodos` Sort Logic

**ไฟล์:** `src/app.component.ts:20-25`

```typescript
filteredTodos = computed(() => {
  const allTodos = this.todos();
  const completed = allTodos.filter(t => t.completed);
  const incomplete = allTodos.filter(t => !t.completed);
  return [...incomplete, ...completed]; // ❌ sort อัตโนมัติทุกครั้ง
});
```

**ปัญหา:** computed signal นี้จัด incomplete tasks ก่อน completed tasks เสมอ แต่ CDK drag-drop ทำงานกับ `filteredTodos()` array ดังนั้นเมื่อผู้ใช้ลาก task แล้ว index ที่ถูก save กลับไปใน `todos` signal จะไม่ตรงกับ index จริงใน visual order ทำให้ลำดับที่เห็นกับที่ถูกบันทึกไม่ตรงกัน

**แนวทางแก้ไข:** ควรเลือกระหว่าง:
- (A) ลบ sort logic ออกจาก `filteredTodos` แล้วแสดงตามลำดับที่เก็บไว้
- (B) บันทึกลำดับใน `filteredTodos` โดยตรงและ sync กลับไปยัง `todos`

---

### 10. `tailwindcss` อยู่ใน `dependencies` แทน `devDependencies`

**ไฟล์:** `package.json`

```json
"dependencies": {
  "tailwindcss": "latest" // ❌ ใช้ผ่าน CDN อยู่แล้ว ไม่ควรอยู่ใน dependencies
}
```

นอกจากนี้การใช้ `"latest"` แทนการ pin version เป็นความเสี่ยงที่อาจทำให้ build แตกเมื่อมี breaking change

**แนวทางแก้ไข:**
```json
"devDependencies": {
  "tailwindcss": "^3.4.0"  // ✅ pin version และย้ายไป devDependencies
}
```

---

### 11. `vite` ไม่ได้ถูกใช้งานจริง

**ไฟล์:** `package.json`

```json
"devDependencies": {
  "vite": "^6.2.0" // ❌ ไม่มี script หรือ config ที่ใช้ vite
}
```

**ปัญหา:** โปรเจกต์ใช้ Angular CLI / `@angular/build` สำหรับ build ทั้งหมด `vite` ใน devDependencies เป็น unused dependency ที่เพิ่มขนาด `node_modules` โดยไม่จำเป็น

**แนวทางแก้ไข:** ลบ `vite` ออกจาก devDependencies

---

### 12. Import JSON ไม่ตรวจสอบ Type ของ Fields

**ไฟล์:** `src/services/todo.service.ts:56-65`

```typescript
// ❌ ตรวจสอบแค่ว่า field มีอยู่ ไม่ได้ตรวจว่าเป็น type ที่ถูกต้อง
if (Array.isArray(importedTodos) && importedTodos.every(
  item => 'id' in item && 'title' in item && 'completed' in item
)) {
  this.todos.set(importedTodos);
}
```

**ปัญหา:** ถ้าไฟล์ JSON มี `{ id: 123, title: null, completed: "yes" }` จะผ่าน validation และอาจทำให้แอปแสดงผลผิดพลาด

**แนวทางแก้ไข:**
```typescript
// ✅ ตรวจสอบ type ด้วย
const isValidTodo = (item: unknown): item is Todo =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as Todo).id === 'string' &&
  typeof (item as Todo).title === 'string' &&
  typeof (item as Todo).completed === 'boolean';

if (Array.isArray(importedTodos) && importedTodos.every(isValidTodo)) {
  this.todos.set(importedTodos);
}
```

---

## 🟢 จุดที่ทำได้ดี

### สิ่งที่น่าชื่นชม

1. **Angular Signals** — ใช้ `signal()`, `computed()`, `effect()` ได้ถูกต้องและสอดคล้องกัน ไม่มีการผสม BehaviorSubject หรือ Zone-dependent patterns
2. **OnPush ทุก Component** — ตั้ง `ChangeDetectionStrategy.OnPush` ครบทุก component ช่วยประสิทธิภาพ
3. **Standalone Components** — ใช้ standalone architecture อย่างถูกต้อง ไม่มี NgModule ที่ไม่จำเป็น
4. **Crypto API** — ใช้ `self.crypto.randomUUID()` สำหรับ ID generation แทนการพึ่ง library ภายนอก
5. **Zoneless** — ใช้ `provideExperimentalZonelessChangeDetection()` แสดงถึงการเข้าใจ Angular อย่างลึกซึ้ง
6. **Immutable Updates** — `TodoService` ใช้ spread operator สร้าง array/object ใหม่เสมอ ไม่ mutate state โดยตรง
7. **Effect สำหรับ Side Effects** — ใช้ `effect()` สำหรับ localStorage sync และ DOM class manipulation ได้อย่างเหมาะสม
8. **UX ดี** — UI มี loading state, error state, empty state, และ hover interactions ครบถ้วน
9. **Responsive Design** — ใช้ Tailwind responsive prefixes (`sm:`, `lg:`) อย่างสม่ำเสมอ
10. **ThemeService** — รองรับ `prefers-color-scheme` จาก system preference อัตโนมัติ

---

## สรุปรายการที่ต้องแก้ไข

| ลำดับ | ไฟล์ | ปัญหา | ความสำคัญ |
|---|---|---|---|
| 1 | `auth.service.ts` | Hardcoded password | 🔴 วิกฤต |
| 2 | `auth.service.ts` | Session bypass ง่าย | 🔴 วิกฤต |
| 3 | `login.component.ts` | ขาด `standalone: true` | 🟠 สำคัญ |
| 4 | `package.json` | ขาด `@angular/cdk` dependency | 🟠 สำคัญ |
| 5 | `todo.service.ts` | ไม่มี try-catch ใน loadFromLocalStorage | 🟠 สำคัญ |
| 6 | `app.component.ts` | Services ควรเป็น `protected/private` | 🟡 ปานกลาง |
| 7 | `app.component.ts` | ใช้ `document.getElementById` แทน ViewChild | 🟡 ปานกลาง |
| 8 | `todo.service.ts` | Coupling กับ CdkDragDrop event | 🟡 ปานกลาง |
| 9 | `app.component.ts` | filteredTodos sort ขัดกับ drag-drop | 🟡 ปานกลาง |
| 10 | `package.json` | `tailwindcss` อยู่ผิด section + ไม่ pin version | 🟡 ปานกลาง |
| 11 | `package.json` | `vite` เป็น unused dependency | 🟢 เล็กน้อย |
| 12 | `todo.service.ts` | Import validation ไม่ครอบคลุม type | 🟢 เล็กน้อย |

---

## ข้อแนะนำเพิ่มเติม (อนาคต)

1. **เพิ่ม Unit Tests** — ยังไม่มี test ใดๆ ในโปรเจกต์ ควรเริ่มด้วย `TodoService` และ `AuthService` ก่อน
2. **เพิ่ม ESLint** — ติดตั้ง `@angular-eslint/eslint-plugin` เพื่อ enforce Angular-specific best practices
3. **แยก Task Categories** — ปัจจุบัน Todo มีแค่ title และ dueDate อาจเพิ่ม category หรือ priority ในอนาคต
4. **แก้ copyright** — `login.component.html` ระบุ `&copy;2024` ควรอัปเดตเป็นปีปัจจุบัน
5. **Feature Flag สำหรับ Testing Instructions** — ส่วน "วิธีการทดสอบ" ที่มีรหัสผ่านควรแสดงเฉพาะ development build เท่านั้น
