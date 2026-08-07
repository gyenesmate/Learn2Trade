import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-mat-toast';
import { signal } from '@angular/core';

import { CryptoCardComponent } from './crypto-card.component';
import { AuthService } from '../../../services/auth.service';
import { WatchlistSubscriptionsService } from '../../../services/watchlist-subscriptions.service';
import { NotificationService } from '../../../services/notification.service';
import { CryptoCurrency } from '../../../const/models';

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
        {
          provide: ToastrService,
          useValue: {
            success: vi.fn(),
            info: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
          },
        },
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
