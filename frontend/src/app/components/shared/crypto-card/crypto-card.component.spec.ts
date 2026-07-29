import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';

import { CryptoCardComponent } from './crypto-card.component';

describe('CryptoCardComponent', () => {
  let component: CryptoCardComponent;
  let fixture: ComponentFixture<CryptoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoCardComponent],
      providers: [
        {
          provide: ToastrService,
          useValue: jasmine.createSpyObj<ToastrService>('ToastrService', ['success', 'info', 'warning', 'error'])
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CryptoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
