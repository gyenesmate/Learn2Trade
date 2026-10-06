import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CryptoCardComponent } from './crypto-card.component';
import { AuthService } from '@core/services/auth.service';
import { WatchlistSubscriptionsService } from '@core/services/watchlist-subscriptions.service';
import { NotificationService } from '@core/services/notification.service';
import { BinanceMarketDataService } from '@core/binance/binance-market-data.service';
import { BinanceRestService } from '@core/binance/binance-rest.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { CryptoCurrency } from '@core/models/models';

describe('CryptoCardComponent', () => {
  let component: CryptoCardComponent;
  let fixture: ComponentFixture<CryptoCardComponent>;

  const coin: CryptoCurrency = {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    exchange_currency: 'USD',
    created_at: '',
    updated_at: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoCardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isLoggedIn: signal(false),
          },
        },
        {
          provide: WatchlistSubscriptionsService,
          useValue: {
            ids: signal(new Set<string>()).asReadonly(),
            getMe: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            deleteByCryptoCurrencyId: vi.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            success: vi.fn(),
            info: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
            alert: vi.fn(),
          },
        },
        {
          provide: BinanceMarketDataService,
          useValue: {
            watchMiniTicker: () => of(),
          },
        },
        {
          provide: BinanceRestService,
          useValue: {
            getKlines: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: WebSocketService,
          useValue: {
            state: signal<'connected' | 'disconnected' | 'reconnecting'>('disconnected'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptoCardComponent);
    fixture.componentRef.setInput('data', coin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
