import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { from, map, Observable } from 'rxjs';
import { UsersService } from '../services/users.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private users: UsersService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return from(this.users.isCurrentUserAdmin()).pipe(
      map(isAdmin => {
        if (!isAdmin) {
          this.router.navigate(['/home']);
          return false;
        }
        return true;
      })
    );
  }
}
