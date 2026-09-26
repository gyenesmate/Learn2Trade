import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CryptoCurrency } from '@core/models/models';
import { BaseDialogComponent } from '@shared/components/base-dialog/base-dialog.component';

export interface SetPriceAlertDialogData {
  crypto: CryptoCurrency;
  currentPrice: number;
}

export interface SetPriceAlertDialogResult {
  alertPrice: number;
  description: string;
}

@Component({
  selector: 'app-set-price-alert-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DecimalPipe,
    BaseDialogComponent,
  ],
  templateUrl: './set-price-alert-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./set-price-alert-dialog.component.scss']
})
export class SetPriceAlertDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<SetPriceAlertDialogComponent, SetPriceAlertDialogResult | null>>(MatDialogRef);
  readonly data = inject<SetPriceAlertDialogData>(MAT_DIALOG_DATA);

  alertPrice: number | null = null;
  description = '';

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    const p = Number(this.alertPrice);
    if (!Number.isFinite(p) || p <= 0) return;
    this.dialogRef.close({ alertPrice: p, description: String(this.description || '') });
  }
}
