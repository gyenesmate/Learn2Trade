import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Learning / interactive guide shell. */
@Component({
  selector: 'app-lecture-layout',
  imports: [RouterOutlet],
  templateUrl: './lecture-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LectureLayoutComponent {}
