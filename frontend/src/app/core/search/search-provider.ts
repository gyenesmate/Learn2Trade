import { Observable } from 'rxjs';
import { SearchResult } from './search.types';

export interface SearchProvider {
  readonly id: string;
  search(query: string): Observable<SearchResult[]>;
}
