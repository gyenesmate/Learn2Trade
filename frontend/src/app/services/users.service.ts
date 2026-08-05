import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, UserMe } from '../const/models';
import { ApiService } from '../core/api.service';
import { toNumber } from '../core/number.util';
import { AuthService } from './auth.service';

export interface UserProfileUpdate {
  username?: string;
  avatar_url?: string | null;
  theme?: 'light' | 'dark' | 'system';
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private normalizeUserMe(user: UserMe): UserMe {
    return {
      ...user,
      balance: toNumber(user.balance),
      profit_index: toNumber(user.profit_index),
    };
  }

  async getAll(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(this.api.url('/users')));
  }

  async getCurrentUserData(): Promise<UserMe | null> {
    const cached = this.auth.getCurrentUserData();
    if (cached === undefined) {
      await this.auth.refreshUserData();
      return this.auth.getCurrentUserData() ?? null;
    }
    return cached;
  }

  async updateProfile(updates: UserProfileUpdate): Promise<UserMe> {
    const user = await firstValueFrom(
      this.http.patch<UserMe>(this.api.url('/users/me'), updates)
    );
    const normalized = this.normalizeUserMe(user);
    await this.auth.refreshUserData();
    return normalized;
  }

  async addCurrencyToBalance(amount: number): Promise<UserMe> {
    const user = await firstValueFrom(
      this.http.post<UserMe>(this.api.url('/users/me/wallet/deposit'), {
        amount: Number(amount),
      })
    );
    await this.auth.refreshUserData();
    return this.normalizeUserMe(user);
  }

  async subtractCurrencyFromBalance(amount: number): Promise<UserMe> {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    const user = await firstValueFrom(
      this.http.post<UserMe>(this.api.url('/users/me/wallet/withdraw'), {
        amount: Number(amount),
      })
    );
    await this.auth.refreshUserData();
    return this.normalizeUserMe(user);
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    const user = await this.getCurrentUserData();
    return user?.is_admin ?? false;
  }

  async banByUid(userId: string): Promise<User> {
    const isAdmin = await this.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can ban users');
    }
    const user = await firstValueFrom(
      this.http.post<User>(this.api.url(`/users/${userId}/ban`), null)
    );
    await this.auth.refreshUserData();
    return user;
  }

  async unbanByUid(userId: string): Promise<User> {
    const isAdmin = await this.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can unban users');
    }
    const user = await firstValueFrom(
      this.http.post<User>(this.api.url(`/users/${userId}/unban`), null)
    );
    await this.auth.refreshUserData();
    return user;
  }
}
