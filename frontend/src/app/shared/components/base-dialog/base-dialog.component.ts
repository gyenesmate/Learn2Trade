import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-base-dialog',
  imports: [MatDialogModule],
  templateUrl: './base-dialog.component.html',
  styleUrls: ['./base-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'base-dialog',
  },
})
export class BaseDialogComponent {}
