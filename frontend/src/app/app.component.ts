import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationStackComponent } from '@shared/components/app-snackbar/notification-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationStackComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {}
