import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CryptoCurrency } from '../../../const/models';

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
  imports: [FormsModule, MatDialogModule, DecimalPipe],
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
