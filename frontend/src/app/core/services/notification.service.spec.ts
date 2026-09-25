import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('emits success/info/warning with auto-dismiss duration', async () => {
    const next = firstValueFrom(service.requests$.pipe(take(1)));
    service.success('ok');
    await expect(next).resolves.toEqual(
      expect.objectContaining({
        message: 'ok',
        title: 'Success',
        variant: 'success',
        duration: 3500,
      })
    );

    const info = firstValueFrom(service.requests$.pipe(take(1)));
    service.info('i');
    await expect(info).resolves.toEqual(
      expect.objectContaining({ variant: 'info', duration: 3500 })
    );

    const warning = firstValueFrom(service.requests$.pipe(take(1)));
    service.warning('w');
    await expect(warning).resolves.toEqual(
      expect.objectContaining({ variant: 'warning', duration: 3500 })
    );
  });

  it('emits error with duration 0', async () => {
    const next = firstValueFrom(service.requests$.pipe(take(1)));
    service.error('e');
    await expect(next).resolves.toEqual(
      expect.objectContaining({
        message: 'e',
        title: 'Error',
        variant: 'error',
        duration: 0,
      })
    );
  });

  it('emits alert with duration 0 and optional actions', async () => {
    const actions = [{ label: 'View', run: vi.fn() }];
    const next = firstValueFrom(service.requests$.pipe(take(1)));
    service.alert('price hit', 'Crypto Alert', actions);
    await expect(next).resolves.toEqual(
      expect.objectContaining({
        message: 'price hit',
        title: 'Crypto Alert',
        variant: 'alert',
        duration: 0,
        actions,
      })
    );
  });
});
