import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';
const LOGIN_TIME_KEY = 'loginTime';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
  }

  getLoginTime(): number | null {
    const raw = localStorage.getItem(LOGIN_TIME_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
