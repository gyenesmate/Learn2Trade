import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-banned-page',
  templateUrl: './banned-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./banned-page.component.scss']
})
export class BannedPageComponent {
  private readonly router = inject(Router);

  supportEmail = 'support@example.com';

  goHome(): void {
    void this.router.navigate(['/home']);
  }
}
