import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-banned-page',
  standalone: true,
  templateUrl: './banned-page.component.html',
  styleUrls: ['./banned-page.component.scss']
})
export class BannedPageComponent {
  supportEmail = 'support@example.com';

  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/home']);
  }
}
