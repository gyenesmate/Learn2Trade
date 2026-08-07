import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { A11yModule } from '@angular/cdk/a11y';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, A11yModule, RouterLink],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  submitted = false;

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    console.log('[LoginPage] onSubmit triggered', { email });
    try {
      await this.authService.login(email ?? '', password ?? '');
      console.log('[LoginPage] login succeeded, navigating to dashboard');
      void this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('[LoginPage] Login error:', error);
      if ((error as { code?: string })?.code === 'auth/banned') {
        void this.router.navigate(['/banned']);
        return;
      }

      this.notifications.error('Username or password is incorrect.', 'Login failed');
    }
  }

  get emailControl() {
    return this.form.get('email');
  }

  get passwordControl() {
    return this.form.get('password');
  }
}
