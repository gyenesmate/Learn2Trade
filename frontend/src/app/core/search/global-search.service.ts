import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import {
  GLOBAL_SEARCH_PROVIDERS,
  GlobalSearchState,
  SearchProvider,
  SearchResult,
  SearchResultGroup,
} from './search.types';
import { dedupeById, groupResults, normalizeQuery, rankResults } from './search.utils';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly providers = inject(GLOBAL_SEARCH_PROVIDERS, { optional: true }) ?? [];

  /** Debounced search stream suitable for binding from the UI. */
  search$(query$: Observable<string>): Observable<GlobalSearchState> {
    return query$.pipe(
      map((q) => normalizeQuery(q)),
      distinctUntilChanged(),
      debounceTime(120),
      switchMap((query) => {
        if (!query) {
          return of({ query, loading: false, groups: [] as SearchResultGroup[] });
        }

        return this.queryProviders(query).pipe(
          map((results) => ({
            query,
            loading: false,
            groups: groupResults(rankResults(dedupeById(results), query)),
          })),
          startWith({ query, loading: true, groups: [] as SearchResultGroup[] }),
          catchError(() => of({ query, loading: false, groups: [] as SearchResultGroup[] }))
        );
      })
    );
  }

  private queryProviders(query: string): Observable<SearchResult[]> {
    const providers = this.providers as readonly SearchProvider[];
    if (!providers.length) {
      return of([]);
    }

    return forkJoin(
      providers.map((provider) =>
        provider.search(query).pipe(catchError(() => of([] as SearchResult[])))
      )
    ).pipe(map((batches) => batches.flat()));
  }
}
