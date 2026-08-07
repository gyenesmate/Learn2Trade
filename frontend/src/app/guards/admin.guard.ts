import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsersService } from '../services/users.service';

export const adminGuard: CanActivateFn = async () => {
  const users = inject(UsersService);
  const router = inject(Router);
  const isAdmin = await users.isCurrentUserAdmin();
  if (!isAdmin) {
    await router.navigate(['/home']);
    return false;
  }
  return true;
};
