import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Public marketing/home shell (no trading chrome). */
@Component({
  selector: 'app-landing-layout',
  imports: [RouterOutlet],
  templateUrl: './landing-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingLayoutComponent {}
