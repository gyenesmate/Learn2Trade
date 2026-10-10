import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { ConfirmationDialogData } from './confirmation-dialog.types';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatDialogModule, MatButtonModule, BaseDialogComponent],
  templateUrl: './confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  readonly dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
