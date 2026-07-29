import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title = 'Success'): void {
    this.toastr.success(message, title);
  }

  info(message: string, title = 'Info'): void {
    this.toastr.info(message, title);
  }

  warning(message: string, title = 'Warning'): void {
    this.toastr.warning(message, title);
  }

  error(message: string, title = 'Error'): void {
    this.toastr.error(message, title);
  }

  alert(message: string, title = 'Crypto Alert'): void {
    // Use warning style for alerts, but with a custom title
    this.toastr.warning(message, title);
  }
}
