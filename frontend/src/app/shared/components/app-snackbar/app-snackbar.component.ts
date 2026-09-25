import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppSnackbarAction, AppSnackbarData } from './app-snackbar.model';

@Component({
  selector: 'app-snackbar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './app-snackbar.component.html',
  styleUrl: './app-snackbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'data().variant',
    class: 'app-snackbar',
    role: 'status',
  },
})
export class AppSnackbarComponent {
  readonly data = input.required<AppSnackbarData>();
  readonly dismissed = output<void>();

  dismiss(): void {
    this.dismissed.emit();
  }

  run(action: AppSnackbarAction): void {
    action.run();
    this.dismissed.emit();
  }
}
