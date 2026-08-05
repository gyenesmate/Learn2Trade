import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoCardComponent } from '../../shared/crypto-card/crypto-card.component';
import { CryptoCurrency } from '../../../const/models';

@Component({
  selector: 'app-testing-ground',
  standalone: true,
  imports: [CommonModule, CryptoCardComponent],
  templateUrl: './testing-ground.component.html',
  styleUrls: ['./testing-ground.component.scss'],
})
export class TestingGroundComponent implements OnInit {
  ethData: CryptoCurrency = {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    exchange_currency: 'USD',
    created_at: '',
    updated_at: '',
  };

  ngOnInit(): void {}
}
