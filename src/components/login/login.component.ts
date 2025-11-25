
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);
  password = signal('');
  error = signal<string | null>(null);
  isLoggingIn = signal(false);

  onPasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
    this.error.set(null);
  }

  login() {
    if (this.isLoggingIn()) return;
    this.isLoggingIn.set(true);
    this.error.set(null);

    // Simulate network delay
    setTimeout(() => {
      const success = this.authService.login(this.password());
      if (!success) {
        this.error.set('Invalid password. Please try again.');
        this.password.set('');
      }
      this.isLoggingIn.set(false);
    }, 500);
  }
}
