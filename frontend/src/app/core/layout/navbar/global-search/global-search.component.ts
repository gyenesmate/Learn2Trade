import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, startWith } from 'rxjs';
import { GlobalSearchService } from '@core/search/global-search.service';
import { SearchResult } from '@core/search/search.types';
import { SearchResultComponent } from './components/search-result/search-result.component';

@Component({
  selector: 'app-global-search',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    TranslatePipe,
    SearchResultComponent,
  ],
  templateUrl: './global-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'global-search block w-full min-w-0 max-w-[480px]',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class GlobalSearchComponent implements OnInit {
  private readonly searchService = inject(GlobalSearchService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly queryInput = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private readonly autocompleteTrigger = viewChild(MatAutocompleteTrigger);

  readonly queryControl = new FormControl('', { nonNullable: true });
  private readonly query$ = new Subject<string>();

  readonly state = toSignal(this.searchService.search$(this.query$.pipe(startWith(''))), {
    initialValue: { query: '', loading: false, groups: [] },
  });

  readonly panelOpen = signal(false);

  ngOnInit(): void {
    this.queryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        // mat-autocomplete writes the selected SearchResult object into the control;
        // only forward plain strings so the search stream never errors out.
        this.query$.next(typeof value === 'string' ? value : '');
      });
  }

  displayResult(result: SearchResult | string | null): string {
    if (!result || typeof result === 'string') {
      return typeof result === 'string' ? result : '';
    }
    return result.title;
  }

  onOptionSelected(result: SearchResult): void {
    this.execute(result);
    // Clear without relying on valueChanges alone (control briefly holds an object).
    this.queryControl.setValue('', { emitEvent: false });
    this.query$.next('');
    this.autocompleteTrigger()?.closePanel();
    this.queryInput()?.nativeElement.blur();
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') {
      return;
    }
    event.preventDefault();
    const input = this.queryInput()?.nativeElement;
    if (!input) return;
    input.focus();
    input.select();
    this.autocompleteTrigger()?.openPanel();
  }

  private execute(result: SearchResult): void {
    switch (result.action.type) {
      case 'route':
        void this.router.navigateByUrl(result.action.route);
        break;
      case 'command':
        // Reserved for future command handlers.
        break;
    }
  }
}
