import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-panel',
  standalone: true,
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-panel',
  },
})
export class PanelComponent {
  readonly title = input<string>('');
}
