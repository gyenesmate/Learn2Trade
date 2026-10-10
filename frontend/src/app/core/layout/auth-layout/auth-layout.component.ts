import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Chrome-free shell for login / register / banned (no sidebar or navbar). */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
