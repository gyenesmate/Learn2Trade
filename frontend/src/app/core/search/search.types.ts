import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type SearchResultType =
  | 'navigation'
  | 'market'
  | 'asset'
  | 'action'
  | 'setting';

export type SearchAction =
  | {
      type: 'route';
      route: string;
    }
  | {
      type: 'command';
      command: string;
    };

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: SearchResultType;
  icon?: string;
  keywords?: string[];
  aliases?: string[];
  action: SearchAction;
  priority?: number;
}

export interface SearchResultGroup {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
}

export interface SearchProvider {
  readonly id: string;
  search(query: string): Observable<SearchResult[]>;
}

export interface GlobalSearchState {
  query: string;
  loading: boolean;
  groups: SearchResultGroup[];
}

export const GLOBAL_SEARCH_PROVIDERS = new InjectionToken<readonly SearchProvider[]>(
  'GLOBAL_SEARCH_PROVIDERS'
);
