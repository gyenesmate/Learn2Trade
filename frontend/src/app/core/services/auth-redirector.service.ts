import { Injectable, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Navigates to login when the session ends while the user is on a protected URL.
 * Guards alone do not re-run when `currentUser` flips without a navigation.
 */
@Injectable({ providedIn: 'root' })
export class AuthRedirectorService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private enabled = false;
  private sawLoggedIn = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (!this.enabled || user === undefined) return;

      if (user != null) {
        this.sawLoggedIn = true;
        return;
      }

      // Ignore cold start guest; only logged-in → logged-out.
      if (!this.sawLoggedIn) return;
      this.sawLoggedIn = false;

      untracked(() => {
        if (!this.isPublicUrl(this.router.url)) {
          void this.router.navigateByUrl('/auth/login');
        }
      });
    });
  }

  /** Arm after auth bootstrap so initial null does not count as a logout transition. */
  start(): void {
    this.enabled = true;
    if (this.auth.currentUser() != null) {
      this.sawLoggedIn = true;
    }
  }

  /** Landing, auth shell, and guest markets — logout may stay here. */
  isPublicUrl(url: string): boolean {
    const path = url.split('?')[0]?.replace(/\/+$/, '') || '/';
    if (path === '/') return true;
    if (path === '/auth' || path.startsWith('/auth/')) return true;
    if (path === '/app/markets') return true;
    return false;
  }
}
