import { SearchResult, SearchResultGroup, SearchResultType } from './search.types';

const GROUP_ORDER: SearchResultType[] = ['market', 'navigation', 'action', 'asset', 'setting'];

const GROUP_LABELS: Record<SearchResultType, string> = {
  market: 'Markets',
  navigation: 'Navigation',
  action: 'Actions',
  asset: 'Assets',
  setting: 'Settings',
};

export function normalizeQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function dedupeById(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const result of results) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    out.push(result);
  }
  return out;
}

function scoreResult(result: SearchResult, query: string): number {
  if (!query) {
    return result.priority ?? 0;
  }

  const title = result.title.toLowerCase();
  const aliases = (result.aliases ?? []).map((a) => a.toLowerCase());
  const keywords = (result.keywords ?? []).map((k) => k.toLowerCase());
  const description = (result.description ?? '').toLowerCase();

  let score = 0;
  if (title === query) score = 1000;
  else if (title.startsWith(query)) score = 800;
  else if (title.includes(query)) score = 600;
  else if (aliases.some((a) => a === query || a.startsWith(query) || a.includes(query))) score = 400;
  else if (keywords.some((k) => k === query || k.startsWith(query) || k.includes(query))) score = 300;
  else if (description.includes(query)) score = 100;
  else return -1;

  return score + (result.priority ?? 0);
}

export function matchesQuery(result: SearchResult, query: string): boolean {
  if (!query) return true;
  return scoreResult(result, query) >= 0;
}

export function rankResults(results: SearchResult[], query: string): SearchResult[] {
  const normalized = normalizeQuery(query);
  return [...results]
    .map((result) => ({ result, score: scoreResult(result, normalized) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .map((entry) => entry.result);
}

export function groupResults(results: SearchResult[]): SearchResultGroup[] {
  const byType = new Map<SearchResultType, SearchResult[]>();
  for (const result of results) {
    const list = byType.get(result.type) ?? [];
    list.push(result);
    byType.set(result.type, list);
  }

  return GROUP_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0).map((type) => ({
    type,
    label: GROUP_LABELS[type],
    results: byType.get(type) ?? [],
  }));
}
