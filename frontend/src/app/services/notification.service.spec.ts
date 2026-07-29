import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'info', 'warning', 'error']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ToastrService, useValue: toastrSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
  });

  it('success/info/error call the matching toastr methods', () => {
    service.success('ok');
    service.info('i');
    service.error('e');

    expect(toastrSpy.success).toHaveBeenCalledWith('ok', 'Success');
    expect(toastrSpy.info).toHaveBeenCalledWith('i', 'Info');
    expect(toastrSpy.error).toHaveBeenCalledWith('e', 'Error');
  });

  it('alert uses warning with custom default title', () => {
    service.alert('price hit');
    expect(toastrSpy.warning).toHaveBeenCalledWith('price hit', 'Crypto Alert');
  });
});
