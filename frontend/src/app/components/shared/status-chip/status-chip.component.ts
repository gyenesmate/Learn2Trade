import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusChipTone = 'neutral' | 'long' | 'short' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'status-chip',
    '[class.status-chip--neutral]': 'tone() === "neutral"',
    '[class.status-chip--long]': 'tone() === "long"',
    '[class.status-chip--short]': 'tone() === "short"',
    '[class.status-chip--success]': 'tone() === "success"',
    '[class.status-chip--danger]': 'tone() === "danger"',
    '[class.status-chip--warning]': 'tone() === "warning"',
  },
})
export class StatusChipComponent {
  readonly tone = input<StatusChipTone>('neutral');
  readonly label = input.required<string>();
}
