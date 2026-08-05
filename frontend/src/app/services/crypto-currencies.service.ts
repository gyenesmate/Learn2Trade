import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CryptoCurrency } from '../const/models';
import { ApiService } from '../core/api.service';

@Injectable({ providedIn: 'root' })
export class CryptoCurrenciesService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  getAll(): Promise<CryptoCurrency[]> {
    return firstValueFrom(
      this.http.get<CryptoCurrency[]>(this.api.url('/cryptocurrencies'))
    );
  }

  getById(id: string): Promise<CryptoCurrency | null> {
    return firstValueFrom(
      this.http.get<CryptoCurrency>(this.api.url(`/cryptocurrencies/${id}`))
    ).catch((err) => {
      if (err?.status === 404) return null;
      throw err;
    });
  }

  create(item: Omit<CryptoCurrency, 'id' | 'created_at' | 'updated_at'>): Promise<CryptoCurrency> {
    return firstValueFrom(
      this.http.post<CryptoCurrency>(this.api.url('/cryptocurrencies'), {
        name: item.name,
        symbol: item.symbol,
        exchange_currency: item.exchange_currency,
      })
    );
  }

  update(
    id: string,
    updates: Partial<Omit<CryptoCurrency, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<CryptoCurrency> {
    return firstValueFrom(
      this.http.patch<CryptoCurrency>(this.api.url(`/cryptocurrencies/${id}`), updates)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(this.api.url(`/cryptocurrencies/${id}`))
    );
  }
}
