import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchResult } from '@core/search/search.types';

@Component({
  selector: 'app-search-result',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './search-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultComponent {
  readonly result = input.required<SearchResult>();
}
