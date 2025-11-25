
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly passwordKey = 'km@2025SD1';
  private readonly sessionKey = 'kwtask-auth';

  isAuthenticated = signal<boolean>(false);

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      const sessionValue = sessionStorage.getItem(this.sessionKey);
      if (sessionValue === 'true') {
        this.isAuthenticated.set(true);
      }
    }
  }

  login(password: string): boolean {
    if (password === this.passwordKey) {
      this.isAuthenticated.set(true);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.sessionKey, 'true');
      }
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticated.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.sessionKey);
    }
  }
}
