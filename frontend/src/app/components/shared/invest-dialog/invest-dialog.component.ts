import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './invest-dialog.component.html',
  styleUrls: ['./invest-dialog.component.scss']
})
export class InvestDialogComponent {
  amount = 0;
  description = '';

  constructor(
    private dialogRef: MatDialogRef<InvestDialogComponent, InvestDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: InvestDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    const amount = Number(this.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.dialogRef.close({ amount, description: String(this.description || '') });
  }
}
