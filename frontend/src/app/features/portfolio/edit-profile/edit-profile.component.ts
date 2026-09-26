import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './edit-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    username: [this.authService.currentUser()?.username ?? '', Validators.required],
    theme: [this.authService.currentUser()?.theme ?? ('light' as 'light' | 'dark' | 'system'), Validators.required],
  });

  async saveProfile(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, theme } = this.form.getRawValue();
    try {
      await this.usersService.updateProfile({ username, theme });
      this.notification.success('Profile updated successfully!');
      void this.router.navigate(['/profile']);
    } catch (error) {
      console.error('Error updating profile:', error);
      this.notification.error('Error updating profile. Please try again.');
    }
  }

  cancel(): void {
    void this.router.navigate(['/profile']);
  }
}
