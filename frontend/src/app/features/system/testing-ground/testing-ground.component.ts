import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import { NeumorphicDirective } from '@shared/directives/neumorphic.directive';
import { CryptoCurrency } from '@core/models/models';

@Component({
  selector: 'app-testing-ground',
  imports: [CryptoCardComponent, NeumorphicDirective],
  templateUrl: './testing-ground.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./testing-ground.component.scss'],
})
export class TestingGroundComponent {
  ethData: CryptoCurrency = {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    exchange_currency: 'USD',
    created_at: '',
    updated_at: '',
  };
}
