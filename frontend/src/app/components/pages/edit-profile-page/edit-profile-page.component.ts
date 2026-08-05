import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { NotificationService } from '../../../services/notification.service';
import { UserMe } from '../../../const/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile-page.component.html',
  styleUrls: ['./edit-profile-page.component.scss']
})
export class EditProfilePageComponent implements OnInit {
  user$: Observable<UserMe | null | undefined>;
  username: string = '';
  theme: 'light' | 'dark' | 'system' = 'light';

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private notification: NotificationService
  ) {
    this.user$ = this.authService.currentUserData$;
  }

  ngOnInit() {
    this.user$.subscribe(user => {
      if (user) {
        this.username = user.username;
        this.theme = user.theme;
      }
    });
  }

  async saveProfile() {
    try {
      await this.usersService.updateProfile({
        username: this.username,
        theme: this.theme
      });
      this.notification.success('Profile updated successfully!');
      this.router.navigate(['/profile']);
    } catch (error) {
      console.error('Error updating profile:', error);
      this.notification.error('Error updating profile. Please try again.');
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
