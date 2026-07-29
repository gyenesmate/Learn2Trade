import { Injectable } from '@angular/core';
import { db } from './db';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  CollectionReference,
  query,
  where,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  async getAll<T>(collectionName: string): Promise<T[]> {
    const colRef = collection(db, collectionName) as CollectionReference;
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
  }

  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as any) } as T) : null;
  }

  async add<T>(collectionName: string, data: T): Promise<string> {
    const colRef = collection(db, collectionName) as CollectionReference;
    const docRef = await addDoc(colRef, data as any);
    return docRef.id;
  }

  async updateById<T>(collectionName: string, id: string, updateData: Partial<T>): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updateData as any);
  }

  async deleteById(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  async getWhere<T>(
    collectionName: string,
    field: string,
    operator: any,
    value: any
  ): Promise<T[]> {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where(field, operator, value));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as T)
    }));
  }

  async updateWhere<T>(
    collectionName: string,
    field: string,
    operator: any,
    value: any,
    updateData: Partial<T>
  ): Promise<void> {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where(field, operator, value));
    const snapshot = await getDocs(q);

    const batch: Promise<void>[] = [];
    snapshot.docs.forEach(docSnap => {
      batch.push(updateDoc(docSnap.ref, updateData as any));
    });

    await Promise.all(batch);
  }

  async deleteWhere(
    collectionName: string,
    field: string,
    operator: any,
    value: any
  ): Promise<void> {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where(field, operator, value));
    const snapshot = await getDocs(q);

    const batch: Promise<void>[] = [];
    snapshot.docs.forEach(docSnap => {
      batch.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(batch);
  }
}
