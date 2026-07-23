import { useState, useEffect, useRef, useCallback } from "react"

export interface SearchIndexEntry {
  id: number
  slug: string
  title: string
  body: string
  section: string
}

export interface SearchResult {
  slug: string
  title: string
  section: string
  excerpt: string
}

const EXCERPT_CONTEXT = 40
const EXCERPT_LENGTH = 120

function makeExcerpt(body: string, query: string): string {
  const lower = body.toLowerCase()
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  let idx = -1
  for (const term of terms) {
    const found = lower.indexOf(term)
    if (found !== -1) { idx = found; break }
  }
  if (idx === -1) return body.slice(0, EXCERPT_LENGTH) + "…"
  const start = Math.max(0, idx - EXCERPT_CONTEXT)
  const end = Math.min(body.length, idx + EXCERPT_LENGTH)
  return (start > 0 ? "…" : "") + body.slice(start, end) + (end < body.length ? "…" : "")
}

export function useFullTextSearch(query: string): {
  results: SearchResult[]
  isLoading: boolean
} {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const flexRef = useRef<any>(null)
  const entriesRef = useRef<SearchIndexEntry[]>([])
  const indexedRef = useRef(false)
  const indexingRef = useRef(false)

  const ensureIndex = useCallback(async () => {
    if (indexedRef.current) return
    if (indexingRef.current) {
      // 既に構築中なら完了を待つ
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (indexedRef.current) { clearInterval(check); resolve() }
        }, 50)
      })
      return
    }
    indexingRef.current = true
    setIsLoading(true)
    try {
      const [FlexSearchModule, res] = await Promise.all([
        import("flexsearch"),
        fetch("/search-index.json"),
      ])
      const FlexSearch = (FlexSearchModule as any).default ?? FlexSearchModule
      const entries: SearchIndexEntry[] = await res.json()
      entriesRef.current = entries

      const index = new FlexSearch.Document({
        tokenize: "full",       // 部分一致
        resolution: 9,
        cache: 100,
        document: {
          id: "id",
          index: [
            { field: "title", tokenize: "full", resolution: 9 },
            { field: "body",  tokenize: "full", resolution: 3 },
          ],
          store: ["slug", "title", "section", "body"],
        },
      })

      for (const entry of entries) {
        index.add(entry)
      }

      flexRef.current = index
      indexedRef.current = true
    } catch (e) {
      console.error("Failed to load search index:", e)
    } finally {
      setIsLoading(false)
      indexingRef.current = false
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    let cancelled = false

    ensureIndex().then(() => {
      if (cancelled || !flexRef.current) return

      const raw = flexRef.current.search(trimmed, {
        limit: 30,
        enrich: true,
        suggest: true,   // 曖昧マッチ
      }) as { field: string; result: { id: number; doc: SearchIndexEntry }[] }[]

      const seen = new Set<string>()
      const merged: SearchResult[] = []

      // titleヒットを優先
      for (const fieldResult of raw) {
        if (fieldResult.field !== "title") continue
        for (const { doc } of fieldResult.result) {
          if (seen.has(doc.slug)) continue
          seen.add(doc.slug)
          merged.push({ slug: doc.slug, title: doc.title, section: doc.section, excerpt: makeExcerpt(doc.body, trimmed) })
        }
      }
      for (const fieldResult of raw) {
        if (fieldResult.field !== "body") continue
        for (const { doc } of fieldResult.result) {
          if (seen.has(doc.slug)) continue
          seen.add(doc.slug)
          merged.push({ slug: doc.slug, title: doc.title, section: doc.section, excerpt: makeExcerpt(doc.body, trimmed) })
        }
      }

      if (!cancelled) setResults(merged)
    })

    return () => { cancelled = true }
  }, [query, ensureIndex])

  return { results, isLoading }
}