import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { AppSnackbarComponent } from './app-snackbar.component';
import { AppSnackbarData, AppSnackbarRequest } from './app-snackbar.model';

/** Leave animation duration — keep scroll locked for this long after dismiss. */
const LEAVE_SCROLL_LOCK_MS = 450;

interface ScrollLock {
  id: string;
  scrollTop: number;
  itemTop: number;
  itemHeight: number;
  until: number;
}

@Component({
  selector: 'app-notification-stack',
  imports: [AppSnackbarComponent],
  templateUrl: './notification-stack.component.html',
  styleUrl: './notification-stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationStackComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly notifications = inject(NotificationService);

  private readonly stack = viewChild.required<ElementRef<HTMLElement>>('stack');
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  /** Active snackbars, oldest → newest (newest sits closest to the bottom-right corner). */
  readonly items = signal<readonly AppSnackbarData[]>([]);
  /** True when content overflows max-height and scrolling is active. */
  readonly scrollable = signal(false);

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private subscription?: Subscription;
  private resizeObserver?: ResizeObserver;
  private nextId = 0;

  /** When true, layout growth may keep the viewport glued to the bottom. */
  private pinnedToBottom = true;
  private scrollLock: ScrollLock | null = null;

  ngOnInit(): void {
    this.subscription = this.notifications.requests$.subscribe((request) => {
      this.enqueue(request);
    });
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') {
      this.updateScrollable();
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.onContentResized());
    this.resizeObserver.observe(this.content().nativeElement);
    this.resizeObserver.observe(this.stack().nativeElement);
    this.updateScrollable();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  onStackScroll(): void {
    if (this.isScrollLocked()) {
      return;
    }
    this.pinnedToBottom = this.isNearBottom();
  }

  dismiss(id: string): void {
    const el = this.stack().nativeElement;
    const row = el.querySelector<HTMLElement>(`[data-snackbar-id="${id}"]`);

    this.scrollLock = {
      id,
      scrollTop: el.scrollTop,
      itemTop: row?.offsetTop ?? 0,
      itemHeight: row?.offsetHeight ?? 0,
      until: performance.now() + LEAVE_SCROLL_LOCK_MS,
    };

    this.clearTimer(id);
    this.items.update((list) => list.filter((item) => item.id !== id));
    this.restoreScrollAfterDismiss();
    this.updateScrollable();
  }

  private enqueue(request: AppSnackbarRequest): void {
    const id = `snackbar-${++this.nextId}`;
    const { duration, ...data } = request;
    const item: AppSnackbarData = { id, ...data };

    this.scrollLock = null;
    this.items.update((list) => [...list, item]);
    this.pinToBottom();

    if (duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration)
      );
    }
  }

  private pinToBottom(): void {
    this.pinnedToBottom = true;
    this.scrollToBottom();
    requestAnimationFrame(() => {
      this.scrollToBottom();
      this.updateScrollable();
      this.scrollToBottom();
    });
  }

  private onContentResized(): void {
    if (this.isScrollLocked()) {
      this.restoreScrollAfterDismiss();
    } else if (this.pinnedToBottom) {
      this.scrollToBottom();
    }
    this.updateScrollable();
  }

  /**
   * Keep the viewport stable while a dismissed row collapses.
   * Without this, shrinking scrollHeight clamps scrollTop to the new bottom.
   */
  private restoreScrollAfterDismiss(): void {
    const el = this.stack()?.nativeElement;
    const lock = this.scrollLock;
    if (!el || !lock) {
      return;
    }

    const leaving = el.querySelector<HTMLElement>(`[data-snackbar-id="${lock.id}"]`);
    const currentHeight = leaving?.offsetHeight ?? 0;
    const shrink = Math.max(0, lock.itemHeight - currentHeight);
    const viewBottom = lock.scrollTop + el.clientHeight;

    let nextTop = lock.scrollTop;

    if (lock.itemTop + lock.itemHeight <= lock.scrollTop) {
      // Fully above the viewport — pull scroll up with the shrink.
      nextTop = lock.scrollTop - shrink;
    } else if (lock.itemTop >= viewBottom) {
      // Fully below the viewport — keep top unless the browser would clamp.
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      nextTop =
        lock.scrollTop > maxScroll
          ? Math.max(0, lock.scrollTop - shrink)
          : lock.scrollTop;
    } else {
      // Intersects the viewport — keep the top edge anchored.
      nextTop = lock.scrollTop;
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      if (nextTop > maxScroll) {
        nextTop = Math.max(0, lock.scrollTop - shrink);
      }
    }

    el.scrollTop = Math.max(0, nextTop);
  }

  private isScrollLocked(): boolean {
    return !!this.scrollLock && performance.now() < this.scrollLock.until;
  }

  private isNearBottom(): boolean {
    const el = this.stack()?.nativeElement;
    if (!el) {
      return true;
    }
    return el.scrollHeight - el.scrollTop - el.clientHeight < 8;
  }

  private updateScrollable(): void {
    const el = this.stack()?.nativeElement;
    if (!el) {
      return;
    }
    this.scrollable.set(el.scrollHeight > el.clientHeight + 1);
  }

  private scrollToBottom(): void {
    const el = this.stack()?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
