import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss']
})
export class RegisterPageComponent {
  form: FormGroup;
  submitted = false;

  constructor(
    private authService: AuthService,
    private notifications: NotificationService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: [this.matchPasswords] });
  }

  private matchPasswords(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    try {
      const { userName, email, password } = this.form.getRawValue();
      await this.authService.register(userName ?? '', email ?? '', password ?? '');
      this.router.navigate(['/dashboard']);
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

  get passwordMismatch(): boolean {
    return this.form.errors?.['passwordMismatch'] === true;
  }
}
