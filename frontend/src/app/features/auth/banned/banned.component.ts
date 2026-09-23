import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-banned',
  templateUrl: './banned.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./banned.component.scss']
})
export class BannedComponent {
  private readonly router = inject(Router);

  supportEmail = 'support@example.com';

  goHome(): void {
    void this.router.navigate(['/home']);
  }
}
