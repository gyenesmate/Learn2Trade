import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PriceAlertsService } from '@core/services/price-alerts.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly priceAlerts = inject(PriceAlertsService);

  title = 'cryptowatcher-app';

  ngOnInit(): void {
    // Start background alert polling for the current user (layout hosts the widget UI).
    this.priceAlerts.start();
  }
}
