import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Investment } from '../const/models';
import { ApiService } from '../core/api.service';
import { toNumber, toNumberOrNull } from '../core/number.util';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InvestmentsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private normalize(investment: Investment): Investment {
    return {
      ...investment,
      amount: toNumber(investment.amount),
      buying_price: toNumber(investment.buying_price),
      selling_price: toNumberOrNull(investment.selling_price),
    };
  }

  private normalizeList(items: Investment[]): Investment[] {
    return items.map((item) => this.normalize(item));
  }

  async getAll(): Promise<Investment[]> {
    return this.getByUserId();
  }

  async getById(id: string): Promise<Investment | null> {
    const list = await this.getByUserId();
    return list.find((item) => item.id === id) ?? null;
  }

  async getByUserId(_userId?: string): Promise<Investment[]> {
    const items = await firstValueFrom(
      this.http.get<Investment[]>(this.api.url('/investments/me'))
    );
    return this.normalizeList(items);
  }

  async getActiveByUserAndCrypto(
    _userId: string,
    cryptoCurrencyId: string
  ): Promise<Investment[]> {
    const params = new HttpParams().set('crypto_currency_id', cryptoCurrencyId);
    const items = await firstValueFrom(
      this.http.get<Investment[]>(this.api.url('/investments/me/active'), { params })
    );
    return this.normalizeList(items);
  }

  async create(item: {
    crypto_currency_id: string;
    amount: number;
    buying_price: number;
    description?: string | null;
  }): Promise<Investment> {
    const created = await firstValueFrom(
      this.http.post<Investment>(this.api.url('/investments'), {
        crypto_currency_id: item.crypto_currency_id,
        amount: Number(item.amount),
        buying_price: Number(item.buying_price),
        description: item.description ?? null,
      })
    );
    await this.auth.refreshUserData();
    return this.normalize(created);
  }

  async sell(id: string, sellingPrice: number): Promise<Investment> {
    const sold = await firstValueFrom(
      this.http.post<Investment>(this.api.url(`/investments/${id}/sell`), {
        selling_price: Number(sellingPrice),
      })
    );
    await this.auth.refreshUserData();
    return this.normalize(sold);
  }
}
