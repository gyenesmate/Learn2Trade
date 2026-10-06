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
import { BaseDialogComponent } from '@shared/components/base-dialog/base-dialog.component';
import {
  SetPriceAlertDialogData,
  SetPriceAlertDialogResult,
} from './set-price-alert-dialog.types';

@Component({
  selector: 'app-set-price-alert-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DecimalPipe,
    BaseDialogComponent,
  ],
  templateUrl: './set-price-alert-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./set-price-alert-dialog.component.scss'],
})
export class SetPriceAlertDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<SetPriceAlertDialogComponent, SetPriceAlertDialogResult | null>>(
      MatDialogRef
    );
  private readonly fb = inject(FormBuilder);
  readonly data = inject<SetPriceAlertDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    alertPrice: [null as number | null, [Validators.required, Validators.min(0.000001)]],
    description: [''],
  });

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { alertPrice, description } = this.form.getRawValue();
    const p = Number(alertPrice);
    if (!Number.isFinite(p) || p <= 0) return;
    this.dialogRef.close({ alertPrice: p, description: String(description || '') });
  }
}
