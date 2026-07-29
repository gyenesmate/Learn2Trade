import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { UsersService } from './users.service';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { User } from '../const/models';

describe('UsersService', () => {
  let service: UsersService;
  let fsSpy: jasmine.SpyObj<FirestoreService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  let currentUserData$: BehaviorSubject<User | null>;

  const makeUser = (overrides?: Partial<User>): User =>
    ({
      uid: 'u1',
      userName: 'Test',
      email: 't@example.com',
      avatarUrl: null,
      preferences: {
        websiteCurrencyBalance: 10,
        profitIndex: 0,
        theme: 'light',
        watchlistSubscriptions: [],
        investments: []
      },
      isAdmin: false,
      isBanned: false,
      createdAt: {} as any,
      updatedAt: {} as any,
      ...overrides
    }) as User;

  beforeEach(() => {
    fsSpy = jasmine.createSpyObj<FirestoreService>('FirestoreService', [
      'getAll',
      'getById',
      'updateWhere',
      'add'
    ]);

    currentUserData$ = new BehaviorSubject<User | null>(null);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['refreshUserData'], {
      currentUserData$: currentUserData$.asObservable()
    } as any);

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        { provide: FirestoreService, useValue: fsSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(UsersService);
  });

  it('addCurrencyToBalance: throws if user not found', async () => {
    currentUserData$.next(null);
    await expectAsync(service.addCurrencyToBalance('u1', 1)).toBeRejectedWithError('User not found');
  });

  it('addCurrencyToBalance: rounds amount to 2 decimals and updates balance', async () => {
    currentUserData$.next(makeUser({ preferences: { ...makeUser().preferences, websiteCurrencyBalance: 10 } }));

    await service.addCurrencyToBalance('u1', 1.006);

    expect(fsSpy.updateWhere).toHaveBeenCalled();
    const updateArg = (fsSpy.updateWhere.calls.mostRecent().args[4] as any);
    expect(updateArg.preferences.websiteCurrencyBalance).toBe(11.01);
    expect(authSpy.refreshUserData).toHaveBeenCalled();
  });

  it('subtractCurrencyFromBalance: rejects non-positive amount', async () => {
    currentUserData$.next(makeUser());
    await expectAsync(service.subtractCurrencyFromBalance('u1', 0)).toBeRejectedWithError('Amount must be greater than 0');
  });

  it('subtractCurrencyFromBalance: rejects if insufficient balance after rounding', async () => {
    currentUserData$.next(makeUser({ preferences: { ...makeUser().preferences, websiteCurrencyBalance: 1 } }));
    await expectAsync(service.subtractCurrencyFromBalance('u1', 1.006)).toBeRejectedWithError('Insufficient balance');
  });

  it('subtractCurrencyFromBalance: updates balance and refreshes user data', async () => {
    currentUserData$.next(makeUser({ preferences: { ...makeUser().preferences, websiteCurrencyBalance: 10 } }));

    await service.subtractCurrencyFromBalance('u1', 1.006);

    const updateArg = (fsSpy.updateWhere.calls.mostRecent().args[4] as any);
    expect(updateArg.preferences.websiteCurrencyBalance).toBe(8.99);
    expect(authSpy.refreshUserData).toHaveBeenCalled();
  });

  it('isCurrentUserAdmin: returns false when no user data', async () => {
    currentUserData$.next(null);
    await expectAsync(service.isCurrentUserAdmin()).toBeResolvedTo(false);
  });

  it('isCurrentUserAdmin: returns true for admin user', async () => {
    currentUserData$.next(makeUser({ isAdmin: true }));
    await expectAsync(service.isCurrentUserAdmin()).toBeResolvedTo(true);
  });
});
