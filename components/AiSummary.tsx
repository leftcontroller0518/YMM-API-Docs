"use client"

import { useState } from "react"
import { Sparkles, Loader2, RotateCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AiSummaryProps {
  /** キャッシュ識別子（記事のスラッグ） */
  articleId: string
  /** 要約対象の本文（Markdown） */
  text: string
  className?: string
}

type Status = "idle" | "loading" | "done" | "error"

export function AiSummary({ articleId, text, className }: AiSummaryProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [summary, setSummary] = useState("")
  const [error, setError] = useState("")

  async function handleGenerate() {
    setStatus("loading")
    setError("")

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, text }),
      })

      const data = (await res.json()) as { summary?: string; error?: string }

      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? "要約の生成に失敗しました")
      }

      setSummary(data.summary)
      setStatus("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "要約の生成に失敗しました")
      setStatus("error")
    }
  }

  return (
    <section
      aria-label="AI による要約"
      className={cn(
        "not-prose mb-8 rounded-lg border bg-accent/40 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>AI 要約</span>
        </div>

        {status === "idle" && (
          <Button size="sm" variant="secondary" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            要約を生成
          </Button>
        )}

        {status === "loading" && (
          <Button size="sm" variant="secondary" disabled>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            生成中...
          </Button>
        )}

        {(status === "done" || status === "error") && (
          <Button size="sm" variant="ghost" onClick={handleGenerate}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            再生成
          </Button>
        )}
      </div>

      {/* 本文エリア（生成前は説明、生成後は結果） */}
      <div aria-live="polite" className="mt-3 text-sm">
        {status === "idle" && (
          <p className="text-muted-foreground leading-relaxed">
            この記事の内容を AI が数行に要約します。
          </p>
        )}

        {status === "loading" && (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        )}

        {status === "done" && (
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">{summary}</p>
        )}

        {status === "error" && (
          <p className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {/* AI 生成であることの注記 */}
      {status === "done" && (
        <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
          この要約は生成 AI（Gemini）によって作成されています。内容が正確でない場合があります。
        </p>
      )}
    </section>
  )
}
