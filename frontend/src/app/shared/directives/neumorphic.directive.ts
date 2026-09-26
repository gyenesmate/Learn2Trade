import { Directive, computed, input, signal } from '@angular/core';

export type NeuState = 'raised' | 'pressed' | 'floating';

@Directive({
  selector: '[appNeumorphic]',
  host: {
    class: 'neu',
    '[class.neu--raised]': 'resolvedState() === "raised"',
    '[class.neu--pressed]': 'resolvedState() === "pressed"',
    '[class.neu--floating]': 'resolvedState() === "floating"',
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(mousedown)': 'onPointerDown()',
    '(mouseup)': 'onPointerUp()',
  },
})
export class NeumorphicDirective {
  /** Static state when not interactive. */
  readonly neuState = input<NeuState>('raised');
  /** When true, hover → floating and active → pressed. */
  readonly neuInteractive = input(false);

  private readonly hover = signal(false);
  private readonly pressed = signal(false);

  protected readonly resolvedState = computed<NeuState>(() => {
    if (!this.neuInteractive()) {
      return this.neuState();
    }
    if (this.pressed()) {
      return 'pressed';
    }
    if (this.hover()) {
      return 'floating';
    }
    return this.neuState();
  });

  protected onPointerEnter(): void {
    if (this.neuInteractive()) {
      this.hover.set(true);
    }
  }

  protected onPointerLeave(): void {
    if (this.neuInteractive()) {
      this.hover.set(false);
      this.pressed.set(false);
    }
  }

  protected onPointerDown(): void {
    if (this.neuInteractive()) {
      this.pressed.set(true);
    }
  }

  protected onPointerUp(): void {
    if (this.neuInteractive()) {
      this.pressed.set(false);
    }
  }
}
