import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TokenResponse, UserMe } from '../const/models';
import { ApiService } from '../core/api.service';
import { TokenStorageService } from '../core/token.storage';
import { toNumber } from '../core/number.util';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);

  /** undefined = auth bootstrapping; null = logged out; UserMe = logged in */
  readonly currentUser = signal<UserMe | null | undefined>(undefined);
  readonly isLoggedIn = computed(() => this.currentUser() != null);

  /** Monitoring session timeout. (Update plan: might be better to use setTimeout with calculated expiration time) */
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  async bootstrap(): Promise<void> {
    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.currentUser.set(null);
      return;
    }

    if (this.isSessionExpired()) {
      this.clearSession();
      this.currentUser.set(null);
      return;
    }

    try {
      await this.refreshUserData();
      this.startSessionTimer();
    } catch {
      this.clearSession();
      this.currentUser.set(null);
    }
  }

  private normalizeUser(user: UserMe): UserMe {
    return {
      ...user,
      balance: toNumber(user.balance),
      profit_index: toNumber(user.profit_index),
    };
  }

  private applyAuthSuccess(response: TokenResponse): UserMe {
    this.tokenStorage.setAccessToken(response.access_token);
    const user = this.normalizeUser(response.user);
    this.currentUser.set(user);
    this.startSessionTimer();
    return user;
  }

  async login(email: string, password: string): Promise<UserMe> {
    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(this.api.url('/auth/login'), { email, password })
      );
      return this.applyAuthSuccess(response);
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { detail?: string } };
      const detail = String(httpErr?.error?.detail ?? '');
      if (httpErr?.status === 403 && detail.toLowerCase().includes('banned')) {
        this.clearSession();
        this.currentUser.set(null);
        throw { code: 'auth/banned', message: 'User is banned' };
      }
      throw err;
    }
  }

  async register(username: string, email: string, password: string): Promise<UserMe> {
    const response = await firstValueFrom(
      this.http.post<TokenResponse>(this.api.url('/auth/register'), {
        username,
        email,
        password,
      })
    );
    return this.applyAuthSuccess(response);
  }

  async refreshUserData(): Promise<void> {
    if (!this.tokenStorage.getAccessToken()) {
      this.currentUser.set(null);
      return;
    }
    const user = await firstValueFrom(
      this.http.get<UserMe>(this.api.url('/auth/me'))
    );
    this.currentUser.set(this.normalizeUser(user));
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.api.url('/auth/logout'), null));
    } catch {
      // Stateless JWT logout; ignore network errors when clearing client session.
    }
    this.clearSession();
    this.currentUser.set(null);
  }

  private clearSession(): void {
    this.tokenStorage.clear();
    this.clearSessionTimer();
  }

  private startSessionTimer(): void {
    this.clearSessionTimer();
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, 60_000);
  }

  private clearSessionTimer(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private checkSessionTimeout(): void {
    if (this.isSessionExpired()) {
      void this.logout();
    }
  }

  isSessionExpired(): boolean {
    const loginTime = this.tokenStorage.getLoginTime();
    if (loginTime === null) {
      return !this.tokenStorage.getAccessToken();
    }
    const expired = Date.now() - loginTime > SESSION_TIMEOUT_MS;
    if (expired) {
      void this.logout();
    }
    return expired;
  }

  getCurrentUserData(): UserMe | null | undefined {
    return this.currentUser();
  }
}
