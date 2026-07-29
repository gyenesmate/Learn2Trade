import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

import { AdminGuard } from './admin.guard';
import { UsersService } from '../services/users.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let usersSpy: jasmine.SpyObj<UsersService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    usersSpy = jasmine.createSpyObj<UsersService>('UsersService', ['isCurrentUserAdmin']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: UsersService, useValue: usersSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AdminGuard);
  });

  it('navigates to /home when not admin', async () => {
    usersSpy.isCurrentUserAdmin.and.resolveTo(false);

    const allowed = await firstValueFrom(guard.canActivate());

    expect(allowed).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows navigation when admin', async () => {
    usersSpy.isCurrentUserAdmin.and.resolveTo(true);

    const allowed = await firstValueFrom(guard.canActivate());

    expect(allowed).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
