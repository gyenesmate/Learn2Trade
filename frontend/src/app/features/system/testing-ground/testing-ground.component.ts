import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CryptoCardComponent } from '@shared/components/crypto-card/crypto-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { NeumorphicDirective } from '@shared/directives/neumorphic.directive';
import { CryptoCurrency } from '@core/models/models';
import { TESTING_GROUND_PAGE_TITLE } from './testing-ground.const';

@Component({
  selector: 'app-testing-ground',
  imports: [CryptoCardComponent, NeumorphicDirective, PageHeaderComponent],
  templateUrl: './testing-ground.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./testing-ground.component.scss'],
})
export class TestingGroundComponent {
  readonly pageTitle = TESTING_GROUND_PAGE_TITLE;

  ethData: CryptoCurrency = {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    exchange_currency: 'USD',
    created_at: '',
    updated_at: '',
  };
}
