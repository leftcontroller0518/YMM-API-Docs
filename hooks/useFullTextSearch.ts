import { useState, useEffect, useRef, useCallback } from "react";
import type { Document } from "flexsearch";

export interface SearchIndexEntry {
  id: number;
  slug: string;
  title: string;
  body: string;
  section: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  section: string;
  excerpt: string;
}

const EXCERPT_CONTEXT = 40;
const EXCERPT_LENGTH = 120;
const DEBOUNCE_DELAY = 300; // ms

function makeExcerpt(body: string, query: string): string {
  const lower = body.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  let idx = -1;
  for (const term of terms) {
    const found = lower.indexOf(term);
    if (found !== -1) {
      idx = found;
      break;
    }
  }

  if (idx === -1) return body.slice(0, EXCERPT_LENGTH) + "…";

  const start = Math.max(0, idx - EXCERPT_CONTEXT);
  const end = Math.min(body.length, idx + EXCERPT_LENGTH);

  return (
    (start > 0 ? "…" : "") +
    body.slice(start, end) +
    (end < body.length ? "…" : "")
  );
}

export function useFullTextSearch(query: string): {
  results: SearchResult[];
  isLoading: boolean;
} {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // FlexSearch インスタンスと関連データ
  const indexRef = useRef<Document<any, any> | null>(null);
  const bodyMapRef = useRef<Map<string, string>>(new Map());
  const indexedRef = useRef(false);
  const indexPromiseRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // デバウンス用タイマー
  const debounceTimerRef = useRef<number | null>(null);

  // インデックス読み込み
  const ensureIndex = useCallback(async () => {
    if (indexedRef.current) return;
    if (indexPromiseRef.current) return indexPromiseRef.current;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    indexPromiseRef.current = (async () => {
      setIsLoading(true);
      try {
        const [FlexSearchModule, res] = await Promise.all([
          import("flexsearch"),
          fetch("/search-index.json", { signal: controller.signal }),
        ]);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const entries: SearchIndexEntry[] = await res.json();

        const FlexSearch = (FlexSearchModule as any).default ?? FlexSearchModule;

        const index = new FlexSearch.Document({
          tokenize: "full",
          resolution: 9,
          cache: 100,
          document: {
            id: "id",
            index: [
              { field: "title", tokenize: "full", resolution: 9 },
              { field: "body", tokenize: "full", resolution: 3 },
            ],
            store: ["slug", "title", "section"],
          },
        });

        for (const entry of entries) {
          bodyMapRef.current.set(entry.slug, entry.body);
          index.add(entry);
        }

        indexRef.current = index;
        indexedRef.current = true;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;

        console.error("Failed to load search index:", e);
        indexPromiseRef.current = null;
        throw e;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    })();

    return indexPromiseRef.current;
  }, []);

  // 検索処理
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        await ensureIndex();

        if (!indexRef.current) {
          return;
        }

        const raw = indexRef.current.search(searchQuery, {
          limit: 100,
          enrich: true,
          suggest: true,
        }) as {
          field: string;
          result: {
            id: number;
            doc: { slug: string; title: string; section: string };
          }[];
        }[];

        const seen = new Set<string>();
        const merged: SearchResult[] = [];

        const append = (field: "title" | "body") => {
          const result = raw.find((x) => x.field === field);
          if (!result) return;

          for (const { doc } of result.result) {
            if (seen.has(doc.slug)) continue;
            seen.add(doc.slug);

            merged.push({
              slug: doc.slug,
              title: doc.title,
              section: doc.section,
              excerpt: makeExcerpt(
                bodyMapRef.current.get(doc.slug) ?? "",
                searchQuery,
              ),
            });
          }
        };

        append("title");
        append("body");

        setResults(merged);
      } catch (e) {
        console.error("Search error:", e);
      }
    },
    [ensureIndex],
  );

  // クエリ変更時のデバウンス処理
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      performSearch(trimmed);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [query, performSearch]);

  return {
    results,
    isLoading,
  };
}