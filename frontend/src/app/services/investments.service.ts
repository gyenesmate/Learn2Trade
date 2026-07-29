import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Investment } from '../const/models';

@Injectable({ providedIn: 'root' })
export class InvestmentsService {
  private readonly collectionName = 'investments';

  constructor(private fs: FirestoreService) {}

  getAll(): Promise<Investment[]> {
    return this.fs.getAll<Investment>(this.collectionName);
  }

  getById(id: string): Promise<Investment | null> {
    return this.fs.getById<Investment>(this.collectionName, id);
  }

  create(item: Omit<Investment, 'id' | 'createdAt'>): Promise<string> {
    const toSave = { ...item, createdAt: new Date() } as any;
    return this.fs.add<Investment>(this.collectionName, toSave);
  }

  getByUserId(userId: string): Promise<Investment[]> {
    return this.fs.getWhere<Investment>(this.collectionName, 'userId', '==', userId);
  }

  async getActiveByUserAndCrypto(userId: string, cryptoCurrencyId: string): Promise<Investment[]> {
    const list = await this.fs.getWhere<Investment>(this.collectionName, 'userId', '==', userId);
    return list.filter(i => i.cryptoCurrencyId === cryptoCurrencyId && !i.isSold);
  }

  updateById(id: string, updates: Partial<Investment>): Promise<void> {
    return this.fs.updateById<Investment>(this.collectionName, id, updates);
  }
}
