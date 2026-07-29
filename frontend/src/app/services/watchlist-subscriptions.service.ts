import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { WatchlistSubscription } from '../const/models';

@Injectable({ providedIn: 'root' })
export class WatchlistSubscriptionsService {
  private readonly collectionName = 'watchlistSubscriptions';

  constructor(private fs: FirestoreService) {}

  getAll(): Promise<WatchlistSubscription[]> {
    return this.fs.getAll<WatchlistSubscription>(this.collectionName);
  }

  getById(id: string): Promise<WatchlistSubscription | null> {
    return this.fs.getById<WatchlistSubscription>(this.collectionName, id);
  }

  create(item: Omit<WatchlistSubscription, 'id'>): Promise<string> {
    return this.fs.add<WatchlistSubscription>(this.collectionName, item as any);
  }

  deleteById(id: string): Promise<void> {
    return this.fs.deleteById(this.collectionName, id);
  }
}

