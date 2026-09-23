import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-edit-profile',
  imports: [FormsModule],
  templateUrl: './edit-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly notification = inject(NotificationService);

  username = this.authService.currentUser()?.username ?? '';
  theme: 'light' | 'dark' | 'system' = this.authService.currentUser()?.theme ?? 'light';

  async saveProfile(): Promise<void> {
    try {
      await this.usersService.updateProfile({
        username: this.username,
        theme: this.theme
      });
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
