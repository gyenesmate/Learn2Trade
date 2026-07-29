import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { UsersService } from './users.service';
import { CryptoCurrency } from '../const/models';

@Injectable({ providedIn: 'root' })
export class CryptoCurrenciesService {
  private readonly collectionName = 'cryptoCurrencys';

  constructor(private fs: FirestoreService, private users: UsersService) {}

  getAll(): Promise<CryptoCurrency[]> {
    return this.fs.getAll<CryptoCurrency>(this.collectionName);
  }

  getById(id: string): Promise<CryptoCurrency | null> {
    return this.fs.getById<CryptoCurrency>(this.collectionName, id);
  }

  async create(item: Omit<CryptoCurrency, 'id'>): Promise<string> {
    const isAdmin = await this.users.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can add cryptocurrencies');
    }
    return this.fs.add<CryptoCurrency>(this.collectionName, item as any);
  }

  async update(id: string, updates: Partial<Omit<CryptoCurrency, 'id'>>): Promise<void> {
    const isAdmin = await this.users.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can update cryptocurrencies');
    }
    await this.fs.updateById<CryptoCurrency>(this.collectionName, id, updates as any);
  }

  async delete(id: string): Promise<void> {
    const isAdmin = await this.users.isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Only admin users can delete cryptocurrencies');
    }
    await this.fs.deleteById(this.collectionName, id);
  }
}
