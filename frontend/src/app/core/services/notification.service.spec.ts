import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-mat-toast';
import { Mock } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let success: Mock;
  let info: Mock;
  let warning: Mock;
  let error: Mock;

  beforeEach(() => {
    success = vi.fn();
    info = vi.fn();
    warning = vi.fn();
    error = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        {
          provide: ToastrService,
          useValue: { success, info, warning, error },
        },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('success/info/error call the matching toastr methods', () => {
    service.success('ok');
    service.info('i');
    service.error('e');

    expect(success).toHaveBeenCalledWith('ok', 'Success');
    expect(info).toHaveBeenCalledWith('i', 'Info');
    expect(error).toHaveBeenCalledWith('e', 'Error');
  });

  it('alert uses warning with custom default title', () => {
    service.alert('price hit');
    expect(warning).toHaveBeenCalledWith('price hit', 'Crypto Alert');
  });
});
