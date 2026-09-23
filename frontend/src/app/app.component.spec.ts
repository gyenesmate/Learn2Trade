import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { ToastrService } from 'ngx-mat-toast';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: ToastrService,
          useValue: {
            success: vi.fn().mockName('ToastrService.success'),
            info: vi.fn().mockName('ToastrService.info'),
            warning: vi.fn().mockName('ToastrService.warning'),
            error: vi.fn().mockName('ToastrService.error'),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'cryptowatcher-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('cryptowatcher-app');
  });

  it('should render the root router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
