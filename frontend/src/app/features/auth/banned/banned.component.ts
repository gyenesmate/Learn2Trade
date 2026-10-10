import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-banned',
  imports: [TranslatePipe],
  templateUrl: './banned.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannedComponent {
  private readonly router = inject(Router);

  supportEmail = 'support@example.com';

  goHome(): void {
    void this.router.navigate(['/app/markets']);
  }
}
