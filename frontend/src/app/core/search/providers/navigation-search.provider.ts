import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { SIDEBAR_LINKS } from '@core/layout/sidebar/sidebar.links';
import { isSidebarLinkVisible } from '@core/layout/sidebar/sidebar-link.model';
import { SearchProvider } from '../search-provider';
import { SearchResult } from '../search.types';
import { matchesQuery, normalizeQuery } from '../search.utils';

@Injectable({ providedIn: 'root' })
export class NavigationSearchProvider implements SearchProvider {
  readonly id = 'navigation';

  private readonly auth = inject(AuthService);

  search(query: string): Observable<SearchResult[]> {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      return of([]);
    }

    const loggedIn = this.auth.isLoggedIn();
    const admin = this.auth.currentUser()?.is_admin === true;

    const results: SearchResult[] = SIDEBAR_LINKS.filter(
      (link) =>
        !!link.route &&
        !link.disabled &&
        isSidebarLinkVisible(link, loggedIn, admin)
    )
      .map(
        (link): SearchResult => ({
          id: `nav:${link.id}`,
          title: link.label,
          description: link.route,
          type: 'navigation',
          icon: link.icon,
          keywords: link.keywords,
          aliases: link.aliases,
          priority: link.priority,
          action: { type: 'route', route: link.route! },
        })
      )
      .filter((result) => matchesQuery(result, normalized));

    return of(results);
  }
}
