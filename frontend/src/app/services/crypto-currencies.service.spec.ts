import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CryptoCurrenciesService } from './crypto-currencies.service';

describe('CryptoCurrenciesService', () => {
  let service: CryptoCurrenciesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CryptoCurrenciesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CryptoCurrenciesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
