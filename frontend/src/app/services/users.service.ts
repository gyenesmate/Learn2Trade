import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { User } from '../const/models';
import { firstValueFrom } from 'rxjs';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly collectionName = 'users';

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  getAll(): Promise<User[]> {
    return this.fs.getAll<User>(this.collectionName);
  }

  getById(id: string): Promise<User | null> {
    return this.fs.getById<User>(this.collectionName, id);
  }

  async getCurrentUserData(): Promise<User | null> {
    return firstValueFrom(this.auth.currentUserData$);
  }

  async updateProfile(userId: string, updates: Partial<Pick<User, 'userName' | 'avatarUrl' | 'preferences'>>): Promise<void> {
    const updateData = { ...updates, updatedAt: new Date() as any };
    await this.fs.updateWhere<User>(this.collectionName, 'uid', '==', userId, updateData);
    await this.auth.refreshUserData();
  }

  async addCurrencyToBalance(userId: string, amount: number): Promise<void> {
    const currentUser = await this.getCurrentUserData();
    if (!currentUser) throw new Error('User not found');
    // Round amount up to 2 decimal places before applying
    const roundedAmount = Number(amount.toFixed(2));
    const newBalance = Number(currentUser.preferences.websiteCurrencyBalance || 0) + roundedAmount;
    const updateData = {
      preferences: {
        ...currentUser.preferences,
        websiteCurrencyBalance: newBalance
      },
      updatedAt: new Date() as any
    };
    await this.fs.updateWhere<User>(this.collectionName, 'uid', '==', userId, updateData);
    await this.auth.refreshUserData();
  }

  async subtractCurrencyFromBalance(userId: string, amount: number): Promise<void> {
    const currentUser = await this.getCurrentUserData();
    if (!currentUser) throw new Error('User not found');
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    // Round amount up to 2 decimal places before subtracting
    const roundedAmount = Number(amount.toFixed(2));
    const currentBalance = Number(currentUser.preferences.websiteCurrencyBalance || 0);
    if (currentBalance < roundedAmount) {
      throw new Error('Insufficient balance');
    }
    const newBalance = currentBalance - roundedAmount;
    const updateData = {
      preferences: {
        ...currentUser.preferences,
        websiteCurrencyBalance: newBalance
      },
      updatedAt: new Date() as any
    };
    await this.fs.updateWhere<User>(this.collectionName, 'uid', '==', userId, updateData);
    await this.auth.refreshUserData();
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadBytes(storageRef, file);
    return `avatars/${userId}`; // Return only the path
  }

  async getAvatarUrl(path: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'preferences.watchlistSubscriptions' | 'preferences.investments'>): Promise<string> {
    // Firestore will add a timestamp on the backend if you prefer
    const toSave = { ...user, createdAt: new Date() } as any;
    return this.fs.add<User>(this.collectionName, toSave);
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    const userData = await this.getCurrentUserData();
    return userData?.isAdmin || false;
  }

  // Mark a user as banned (admin-only). This replaces hard delete behavior.
  async banByUid(uid: string): Promise<void> {
    const isAdmin = await this.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can ban users');
    }

    const updateData: Partial<User> = { isBanned: true as any, updatedAt: new Date() as any };
    await this.fs.updateWhere<User>(this.collectionName, 'uid', '==', uid, updateData);
    await this.auth.refreshUserData();
  }

  // Unban a user (admin-only)
  async unbanByUid(uid: string): Promise<void> {
    const isAdmin = await this.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can unban users');
    }

    const updateData: Partial<User> = { isBanned: false as any, updatedAt: new Date() as any };
    await this.fs.updateWhere<User>(this.collectionName, 'uid', '==', uid, updateData);
    await this.auth.refreshUserData();
  }
}
