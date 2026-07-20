import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

/**
 * Vercel の無料枠（Hobby）は Serverless Function の実行時間が最大 10 秒です。
 * AI 生成が長引いても 10 秒で打ち切られるように上限を明示します。
 */
export const maxDuration = 10

// Node.js ランタイムで動かす（unstable_cache / AI SDK ともに Node 前提）
export const runtime = "nodejs"

// ---- リクエストボディのバリデーション（型安全） --------------------------

const RequestSchema = z.object({
  articleId: z.string().min(1, "articleId は必須です"),
  text: z.string().min(1, "text は必須です"),
})

type SummarizeResponse =
  | { summary: string; cached: boolean }
  | { error: string }

// ---- AI 要約ロジック ------------------------------------------------------

/**
 * Gemini 2.5 Flash で本文を要約する。
 * 本文は Markdown として扱う想定。
 */
async function generateSummary(text: string): Promise<string> {
  const { text: summary } = await generateText({
    // GOOGLE_GENERATIVE_AI_API_KEY を自動的に参照する
    model: google("gemini-2.5-flash"),
    prompt: `以下の文章を5行以内で簡潔に要約してください：\n\n${text}`,
  })

  return summary.trim()
}

/**
 * articleId をキャッシュキーとして AI 要約結果をサーバー側（Data Cache）に保存する。
 *
 * - `text` はクロージャで渡すことで **キャッシュキーには含めず**、articleId だけで識別する。
 *   → 同じ記事に対しては本文が多少変わっても API を叩かず、キャッシュを返す。
 * - `tags: ['summary']` を付与し、記事更新時に
 *   `revalidateTag('summary')` でオンデマンド再検証（強制クリア）できるようにする。
 */
function getCachedSummary(articleId: string, text: string): Promise<string> {
  const cachedFn = unstable_cache(
    async () => generateSummary(text),
    // キャッシュキーの一部。articleId ごとに独立したキャッシュになる。
    ["article-summary", articleId],
    {
      tags: ["summary"],
      // 明示的に revalidateTag するまで保持（時間による自動失効なし）
      revalidate: false,
    },
  )

  return cachedFn()
}

// ---- POST ハンドラ --------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<SummarizeResponse>> {
  // API キー未設定を早期に検知
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "サーバー設定エラー: GOOGLE_GENERATIVE_AI_API_KEY が未設定です" },
      { status: 500 },
    )
  }

  // JSON パース
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正な JSON です" }, { status: 400 })
  }

  // バリデーション
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    )
  }

  const { articleId, text } = parsed.data

  try {
    const summary = await getCachedSummary(articleId, text)
    return NextResponse.json({ summary, cached: true })
  } catch (error) {
    console.log("[v0] summarize error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "要約の生成に失敗しました" }, { status: 502 })
  }
}
