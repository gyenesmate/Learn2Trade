import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PriceAlertsService } from '@core/services/price-alerts.service';
import { NotificationStackComponent } from '@shared/components/app-snackbar/notification-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationStackComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly priceAlerts = inject(PriceAlertsService);

  title = 'cryptowatcher-app';

  ngOnInit(): void {
    // Start background alert polling; fired alerts surface via NotificationService snackbars.
    this.priceAlerts.start();
  }
}
