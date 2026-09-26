import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.group(
    {
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: [this.matchPasswords] }
  );
  submitted = false;
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password');
    const confirm = group.get('confirmPassword');
    if (!password || !confirm) {
      return null;
    }

    if (!password.value || !confirm.value) {
      return null;
    }

    if (password.value !== confirm.value) {
      const other = { ...(confirm.errors ?? {}) };
      other['passwordMismatch'] = true;
      confirm.setErrors(other);
      return { passwordMismatch: true };
    }

    if (confirm.hasError('passwordMismatch')) {
      const { passwordMismatch: _removed, ...rest } = confirm.errors ?? {};
      confirm.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    try {
      const { userName, email, password } = this.form.getRawValue();
      await this.authService.register(userName ?? '', email ?? '', password ?? '');
      void this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Registration error:', error);
      this.notifications.error('Registration failed. Please try again.', 'Registration failed');
    }
  }

  get userNameControl() {
    return this.form.get('userName');
  }

  get emailControl() {
    return this.form.get('email');
  }

  get passwordControl() {
    return this.form.get('password');
  }

  get confirmPasswordControl() {
    return this.form.get('confirmPassword');
  }
}
