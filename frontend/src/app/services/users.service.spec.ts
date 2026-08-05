import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { UserMe } from '../const/models';

describe('UsersService', () => {
  let service: UsersService;
  let authSpy: jasmine.SpyObj<AuthService>;

  const makeUser = (overrides: Partial<UserMe> = {}): UserMe => ({
    id: 'u1',
    username: 'Test',
    email: 't@example.com',
    avatar_url: null,
    is_admin: false,
    is_banned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    theme: 'light',
    balance: 10,
    currency_code: 'USD',
    profit_index: 0,
    ...overrides,
  });

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUserData',
      'refreshUserData',
    ]);
    authSpy.getCurrentUserData.and.returnValue(makeUser());
    authSpy.refreshUserData.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    });
    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isCurrentUserAdmin reflects user.is_admin', async () => {
    authSpy.getCurrentUserData.and.returnValue(makeUser({ is_admin: true }));
    await expectAsync(service.isCurrentUserAdmin()).toBeResolvedTo(true);
  });
});
