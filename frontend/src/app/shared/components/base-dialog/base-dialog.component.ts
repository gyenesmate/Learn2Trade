import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-base-dialog',
  imports: [MatDialogModule],
  templateUrl: './base-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'base-dialog block h-auto w-full max-w-[480px] rounded-lg bg-surface p-4 box-border',
  },
})
export class BaseDialogComponent {}
