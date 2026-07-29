import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, getAuth, updateEmail } from 'firebase/auth';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from '../const/models';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = getAuth();
  // start with undefined so callers know we haven't checked yet
  private currentUserSubject = new BehaviorSubject<FirebaseUser | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  // observable emitting the Firestore user doc
  private currentUserDataSubject = new BehaviorSubject<User | null>(null);
  public currentUserData$ = this.currentUserDataSubject.asObservable();

  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
  private sessionCheckInterval: any;

  constructor(private fs: FirestoreService) {
    onAuthStateChanged(this.auth, (user) => {
      console.log('[AuthService] auth state changed:', user);
      this.currentUserSubject.next(user);
      if (user) {
        this.startSessionTimer();
        this.refreshUserData();
      } else {
        this.clearSessionTimer();
        this.currentUserDataSubject.next(null);
      }
    });

    // Check session on app start
    this.checkSessionTimeout();
  }

  async refreshUserData() {
    const firebaseUser = this.currentUserSubject.value;
    if (!firebaseUser?.uid) {
      this.currentUserDataSubject.next(null);
      return;
    }

    try {
      const users = await this.fs.getWhere<User>('users', 'uid', '==', firebaseUser.uid);
      const userData = users.length > 0 ? users[0] : null;
      this.currentUserDataSubject.next(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      this.currentUserDataSubject.next(null);
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
        // refresh firestore-backed user data and check ban status
        await this.refreshUserData();
        const userData = this.currentUserDataSubject.value;
        if (userData?.isBanned) {
          // immediately sign out banned user
          await signOut(this.auth);
          // surface a specific error code so callers can react (navigate to banned page)
          throw { code: 'auth/banned', message: 'User is banned' };
        }

    } catch (err) {
      throw err;
    }
  }

  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  private startSessionTimer(): void {
    const loginTime = Date.now();
    localStorage.setItem('loginTime', loginTime.toString());
    this.clearSessionTimer();
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // Check every minute
  }

  private clearSessionTimer(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private async checkSessionTimeout(): Promise<void> {
    const loginTimeStr = localStorage.getItem('loginTime');
    if (loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10);
      const currentTime = Date.now();
      if (currentTime - loginTime > this.SESSION_TIMEOUT) {
        await this.logout();
        localStorage.removeItem('loginTime');
      }
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.removeItem('loginTime');
    this.clearSessionTimer();
  }

  isSessionExpired(): boolean {
    const loginTimeStr = localStorage.getItem('loginTime');
    if (!loginTimeStr) return false;
    const loginTime = parseInt(loginTimeStr, 10);
    if (Number.isNaN(loginTime)) {
      localStorage.removeItem('loginTime');
      return false;
    }
    const expired = Date.now() - loginTime > this.SESSION_TIMEOUT;
    if (expired) {
      void this.logout();
    }
    return expired;
  }

  async updateEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await updateEmail(user, newEmail);
    } else {
      throw new Error('No authenticated user');
    }
  }

  getCurrentUser(): FirebaseUser | null | undefined {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUserObservable(): Observable<FirebaseUser | null | undefined> {
    return this.currentUser$;
  }
}