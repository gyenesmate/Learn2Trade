import { TestBed } from '@angular/core/testing';

import { CryptoCurrenciesService } from './crypto-currencies.service';
import { FirestoreService } from './firestore.service';
import { UsersService } from './users.service';

describe('CryptoCurrenciesService', () => {
  let service: CryptoCurrenciesService;
  let fsSpy: jasmine.SpyObj<FirestoreService>;
  let usersSpy: jasmine.SpyObj<UsersService>;

  beforeEach(() => {
    fsSpy = jasmine.createSpyObj<FirestoreService>('FirestoreService', ['getAll', 'getById', 'add', 'updateById', 'deleteById']);
    usersSpy = jasmine.createSpyObj<UsersService>('UsersService', ['isCurrentUserAdmin']);

    TestBed.configureTestingModule({
      providers: [
        CryptoCurrenciesService,
        { provide: FirestoreService, useValue: fsSpy },
        { provide: UsersService, useValue: usersSpy }
      ]
    });

    service = TestBed.inject(CryptoCurrenciesService);
  });

  it('create: throws when user is not admin', async () => {
    usersSpy.isCurrentUserAdmin.and.resolveTo(false);

    await expectAsync(service.create({ name: 'Bitcoin', symbol: 'BTC', exchangeCurrency: 'USD' } as any))
      .toBeRejectedWithError('Only admin users can add cryptocurrencies');

    expect(fsSpy.add).not.toHaveBeenCalled();
  });

  it('create: calls Firestore add when admin', async () => {
    usersSpy.isCurrentUserAdmin.and.resolveTo(true);
    fsSpy.add.and.resolveTo('id1');

    const id = await service.create({ name: 'Bitcoin', symbol: 'BTC', exchangeCurrency: 'USD' } as any);

    expect(id).toBe('id1');
    expect(fsSpy.add).toHaveBeenCalled();
  });

  it('update/delete: enforce admin and call Firestore when admin', async () => {
    usersSpy.isCurrentUserAdmin.and.resolveTo(false);
    await expectAsync(service.update('id1', { name: 'X' } as any))
      .toBeRejectedWithError('Only admin users can update cryptocurrencies');

    usersSpy.isCurrentUserAdmin.and.resolveTo(true);
    fsSpy.updateById.and.resolveTo();
    fsSpy.deleteById.and.resolveTo();

    await service.update('id1', { name: 'X' } as any);
    await service.delete('id1');

    expect(fsSpy.updateById).toHaveBeenCalledWith('cryptoCurrencys', 'id1', jasmine.anything());
    expect(fsSpy.deleteById).toHaveBeenCalledWith('cryptoCurrencys', 'id1');
  });
});
