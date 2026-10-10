import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EDIT_PROFILE_THEME_OPTIONS } from './edit-profile.const';

@Component({
  selector: 'app-edit-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './edit-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full max-w-[50%] mx-auto max-md:max-w-full' },
})
export class EditProfileComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly themeOptions = EDIT_PROFILE_THEME_OPTIONS;

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
      this.notification.success(this.translate.instant('PROFILE.NOTIFY_UPDATED'));
      void this.router.navigate(['/app/profile']);
    } catch (error) {
      console.error('Error updating profile:', error);
      this.notification.error(this.translate.instant('PROFILE.NOTIFY_UPDATE_ERROR'));
    }
  }

  cancel(): void {
    void this.router.navigate(['/app/profile']);
  }
}
