import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseDialogComponent } from '@shared/components/base-dialog/base-dialog.component';
import { InvestDialogData, InvestDialogResult } from './invest-dialog.types';

@Component({
  selector: 'app-invest-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DecimalPipe,
    BaseDialogComponent,
    TranslatePipe,
  ],
  templateUrl: './invest-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<InvestDialogComponent, InvestDialogResult | null>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly decimalPipe = inject(DecimalPipe);
  readonly data = inject<InvestDialogData>(MAT_DIALOG_DATA);

  get availableBalanceText(): string {
    const formatted = this.decimalPipe.transform(this.data.availableBalance, '1.2-2') ?? '0.00';
    return `$${formatted}`;
  }

  readonly form = this.fb.nonNullable.group({
    amount: [0 as number, [Validators.required, Validators.min(0.01)]],
    description: [''],
  });

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { amount, description } = this.form.getRawValue();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    this.dialogRef.close({ amount: n, description: String(description || '') });
  }
}
