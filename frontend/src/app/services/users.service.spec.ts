import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Mock } from 'vitest';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { UserMe } from '../const/models';

describe('UsersService', () => {
  let service: UsersService;
  let getCurrentUserData: Mock;
  let refreshUserData: Mock;

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
    getCurrentUserData = vi.fn().mockReturnValue(makeUser());
    refreshUserData = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getCurrentUserData, refreshUserData },
        },
      ],
    });
    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isCurrentUserAdmin reflects user.is_admin', async () => {
    getCurrentUserData.mockReturnValue(makeUser({ is_admin: true }));
    await expect(service.isCurrentUserAdmin()).resolves.toEqual(true);
  });
});
