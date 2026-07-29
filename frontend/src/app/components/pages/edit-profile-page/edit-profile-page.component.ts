import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { NotificationService } from '../../../services/notification.service';
import { User } from '../../../const/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile-page.component.html',
  styleUrls: ['./edit-profile-page.component.scss']
})
export class EditProfilePageComponent implements OnInit {
  user$: Observable<User | null>;
  userName: string = '';
  theme: string = 'light';
  selectedFile: File | null = null;
  avatarUrl: string = '';
  avatarDisplayUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private notification: NotificationService
  ) {
    this.user$ = this.authService.currentUserData$;
  }

  ngOnInit() {
    this.user$.subscribe(async user => {
      if (user) {
        this.userName = user.userName;
        this.theme = user.preferences.theme;
        this.avatarUrl = user.avatarUrl || '';
        if (this.avatarUrl) {
          this.avatarDisplayUrl = await this.usersService.getAvatarUrl(this.avatarUrl);
        } else {
          this.avatarDisplayUrl = '';
        }
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async saveProfile() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.uid) {
      try {
        const currentUserData = await this.usersService.getCurrentUserData();
        if (!currentUserData) return;

        let avatarUrl = this.avatarUrl;

        if (this.selectedFile) {
          avatarUrl = await this.usersService.uploadAvatar(this.selectedFile, currentUser.uid);
        }

        await this.usersService.updateProfile(currentUser.uid, {
          userName: this.userName,
          avatarUrl: avatarUrl,
          preferences: {
            ...currentUserData.preferences,
            theme: this.theme
          }
        });
        this.notification.success('Profile updated successfully!');
        this.router.navigate(['/profile']);
      } catch (error) {
        console.error('Error updating profile:', error);
        this.notification.error('Error updating profile. Please try again.');
      }
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}