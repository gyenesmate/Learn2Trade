import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SearchResult } from '@core/search/search.types';

@Component({
  selector: 'app-search-result',
  imports: [MatIconModule],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultComponent {
  readonly result = input.required<SearchResult>();
}
