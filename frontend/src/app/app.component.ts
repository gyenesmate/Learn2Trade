import { Component } from '@angular/core';
import { NavigationComponent } from './components/shared/navigation/navigation.component';
import { RouterOutlet } from '@angular/router';
import { FiredAlertsWidgetComponent } from './components/shared/fired-alerts-widget/fired-alerts-widget.component';
import { PriceAlertsService } from './services/price-alerts.service';

@Component({
  selector: 'app-root',
  imports: [NavigationComponent, RouterOutlet, FiredAlertsWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cryptowatcher-app';

  constructor(private priceAlerts: PriceAlertsService) {
    // Start background alert loading/polling for the current user.
    this.priceAlerts.start();
  }
}
