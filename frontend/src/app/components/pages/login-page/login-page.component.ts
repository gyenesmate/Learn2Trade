import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { A11yModule } from "@angular/cdk/a11y";
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  form: FormGroup;
  submitted = false;

  constructor(
    private authService: AuthService,
    private notifications: NotificationService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    console.log('[LoginPage] onSubmit triggered', { email });
    try {
      await this.authService.login(email ?? '', password ?? '');
      console.log('[LoginPage] login succeeded, navigating to dashboard');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('[LoginPage] Login error:', error);
      // if user is banned, navigate to the banned page
      if ((error as any)?.code === 'auth/banned') {
        // already signed out in AuthService; navigate to banned info page
        this.router.navigate(['/banned']);
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