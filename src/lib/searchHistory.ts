// ─── Web Search History ─────────────────────────────
import { addMemory, getTimeTags } from './membrain';

export interface SearchEntry {
  id: string;
  query: string;
  url: string;
  engine: 'google' | 'duckduckgo';
  source: 'panel' | 'desk';
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'ozen-search-history';
const MAX_ENTRIES = 50;

export function getSearchHistory(): SearchEntry[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchEntry[];
  } catch {
    return [];
  }
}

export function addSearchEntry(query: string, url: string, engine: 'google' | 'duckduckgo', source: 'panel' | 'desk'): void {
  const history = getSearchHistory();
  const entry: SearchEntry = {
    id: Date.now().toString(),
    query,
    url,
    engine,
    source,
    timestamp: Date.now(),
  };
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));

  // ── MEMBRAIN: Store web search in background ──────────────────────────
  addMemory(
    `User searched "${query}" on ${engine} via ${source}`,
    ["type.web-search", `source.${source}`, `engine.${engine}`, ...getTimeTags()]
  );
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}
