import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CryptoCurrency } from '../../../const/models';

export interface InvestDialogData {
  crypto: CryptoCurrency;
  currentPrice: number;
}

export interface InvestDialogResult {
  amount: number;
  description: string;
}

@Component({
  selector: 'app-invest-dialog',
  imports: [FormsModule, MatDialogModule, DecimalPipe],
  templateUrl: './invest-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./invest-dialog.component.scss']
})
export class InvestDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<InvestDialogComponent, InvestDialogResult | null>>(MatDialogRef);
  readonly data = inject<InvestDialogData>(MAT_DIALOG_DATA);

  amount = 0;
  description = '';

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    const amount = Number(this.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.dialogRef.close({ amount, description: String(this.description || '') });
  }
}
