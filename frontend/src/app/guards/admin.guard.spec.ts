import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Mock } from 'vitest';

import { adminGuard } from './admin.guard';
import { UsersService } from '../services/users.service';

describe('adminGuard', () => {
  let isCurrentUserAdmin: Mock;
  let navigate: Mock;

  beforeEach(() => {
    isCurrentUserAdmin = vi.fn();
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: UsersService, useValue: { isCurrentUserAdmin } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

  it('navigates to /home when not admin', async () => {
    isCurrentUserAdmin.mockResolvedValue(false);

    const allowed = await runGuard();

    expect(allowed).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows navigation when admin', async () => {
    isCurrentUserAdmin.mockResolvedValue(true);

    const allowed = await runGuard();

    expect(allowed).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
