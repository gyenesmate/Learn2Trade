import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
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
  private readonly currentUserDataSubject = new BehaviorSubject<UserMe | null | undefined>(undefined);
  readonly currentUserData$ = this.currentUserDataSubject.asObservable();

  private readonly authReadySubject = new BehaviorSubject<boolean>(false);
  readonly authReady$ = this.authReadySubject.asObservable();

  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.currentUserDataSubject.next(null);
      this.authReadySubject.next(true);
      return;
    }

    if (this.isSessionExpired()) {
      this.clearSession();
      this.currentUserDataSubject.next(null);
      this.authReadySubject.next(true);
      return;
    }

    try {
      await this.refreshUserData();
      this.startSessionTimer();
    } catch {
      this.clearSession();
      this.currentUserDataSubject.next(null);
    } finally {
      this.authReadySubject.next(true);
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
    this.currentUserDataSubject.next(user);
    this.startSessionTimer();
    return user;
  }

  async login(email: string, password: string): Promise<UserMe> {
    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(this.api.url('/auth/login'), { email, password })
      );
      return this.applyAuthSuccess(response);
    } catch (err: any) {
      const detail = String(err?.error?.detail ?? '');
      if (err?.status === 403 && detail.toLowerCase().includes('banned')) {
        this.clearSession();
        this.currentUserDataSubject.next(null);
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
      this.currentUserDataSubject.next(null);
      return;
    }
    const user = await firstValueFrom(
      this.http.get<UserMe>(this.api.url('/auth/me'))
    );
    this.currentUserDataSubject.next(this.normalizeUser(user));
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.api.url('/auth/logout'), null));
    } catch {
      // Stateless JWT logout; ignore network errors when clearing client session.
    }
    this.clearSession();
    this.currentUserDataSubject.next(null);
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

  isLoggedIn(): boolean {
    return !!this.tokenStorage.getAccessToken() && !!this.currentUserDataSubject.value;
  }

  getCurrentUserData(): UserMe | null | undefined {
    return this.currentUserDataSubject.value;
  }

  getCurrentUserObservable(): Observable<UserMe | null | undefined> {
    return this.currentUserData$;
  }
}
