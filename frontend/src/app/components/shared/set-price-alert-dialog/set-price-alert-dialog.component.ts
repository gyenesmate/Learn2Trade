import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './set-price-alert-dialog.component.html',
  styleUrls: ['./set-price-alert-dialog.component.scss']
})
export class SetPriceAlertDialogComponent {
  alertPrice: number | null = null;
  description = '';

  constructor(
    private dialogRef: MatDialogRef<SetPriceAlertDialogComponent, SetPriceAlertDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: SetPriceAlertDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    const p = Number(this.alertPrice);
    if (!Number.isFinite(p) || p <= 0) return;
    this.dialogRef.close({ alertPrice: p, description: String(this.description || '') });
  }
}
