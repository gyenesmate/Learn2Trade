import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { User } from '../../../const/models';
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
    private usersService: UsersService,
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
      // Register with Firebase Auth
      const { userName, email, password } = this.form.getRawValue();
      await this.authService.register(email ?? '', password ?? '');

      // Get the Firebase user
      const firebaseUser = this.authService.getCurrentUser();
      if (firebaseUser) {
        // Create user data with userName
        const newUser: User = {
          uid: firebaseUser.uid,
          userName: userName ?? '',
          email: firebaseUser.email || '',
          avatarUrl: null,
          preferences: {
            websiteCurrencyBalance: 0,
            profitIndex: 0,
            theme: 'light'
          },
          isAdmin: false,
          isBanned: false,
          createdAt: new Date() as any
        };

        // Save to Firestore
        await this.usersService.create(newUser);
        // A komponensek az AuthService currentUser$-ét figyelik
        // és lekérdezik a UsersService-ből az adatokat a uid alapján
      }

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