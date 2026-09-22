import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { NavigationComponent } from '@shared/navigation/navigation.component';
import { FiredAlertsWidgetComponent } from '@shared/fired-alerts-widget/fired-alerts-widget.component';
import { PriceAlertsService } from '@services/price-alerts.service';

@Component({
  selector: 'app-root',
  imports: [NavigationComponent, FiredAlertsWidgetComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly priceAlerts = inject(PriceAlertsService);

  title = 'cryptowatcher-app';

  ngOnInit(): void {
    this.priceAlerts.start();
  }
}
