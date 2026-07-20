import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { generateText } from "ai"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getDocBySlug } from "@/lib/docs"

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
}).strict()

type SummarizeResponse =
  | { summary: string; cached: boolean }
  | { error: string }

// ---- AI 要約ロジック ------------------------------------------------------

/**
 * Gemini で本文を要約する。
 * 本文は Markdown として扱う想定。
 */
async function generateSummary(text: string): Promise<string> {
  const { text: summary } = await generateText({
    // GOOGLE_GENERATIVE_AI_API_KEY を自動的に参照する。
    // gemini-2.5-flash は新規ユーザー向けに提供終了したため、
    // 高速・低コストで無料枠に適した現行の安定モデルを使用する。
    model: google("gemini-3.1-flash-lite"),
    prompt: `以下の文章を5行以内で簡潔に要約してください：\n\n${text}`,
    // 出力トークンの上限（5行の要約には十分）。暴走を防ぎ、10秒枠に収める。
    maxOutputTokens: 512,
    providerOptions: {
      google: {
        // Gemini 3 系は「思考レベル」で制御する（thinkingBudget は 2.5 系専用）。
        // 要約に深い思考は不要なので 'low' にして高速化し、
        // 10 秒のタイムアウトと思考トークンの浪費を避ける。
        thinkingConfig: { thinkingLevel: "low" },
      } satisfies GoogleLanguageModelOptions,
    },
  })

  const trimmed = summary.trim()
  if (!trimmed) {
    // 空出力を握りつぶさず、明示的にエラーにする（原因の切り分けを容易に）
    throw new Error("モデルが空の応答を返しました")
  }
  return trimmed
}

/**
 * articleId をキャッシュキーとして AI 要約結果をサーバー側（Data Cache）に保存する。
 *
 * - 本文はサーバー側で articleId から取得し、クライアントからは受け取らない。
 * - `tags: ['summary']` を付与し、記事更新時に
 *   `revalidateTag('summary')` でオンデマンド再検証（強制クリア）できるようにする。
 */
function getCachedSummary(articleId: string, markdown: string): Promise<string> {
  const cachedFn = unstable_cache(
    async () => generateSummary(markdown),
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

  const { articleId } = parsed.data
  const doc = await getDocBySlug(articleId === "home" ? "" : articleId, articleId === "home")

  if (!doc) {
    return NextResponse.json({ error: "指定された記事が見つかりません" }, { status: 404 })
  }

  // API キー未設定を早期に検知
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "サーバー設定エラー: GOOGLE_GENERATIVE_AI_API_KEY が未設定です" },
      { status: 500 },
    )
  }

  try {
    const summary = await getCachedSummary(articleId, doc.markdown)
    return NextResponse.json({ summary, cached: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log("[v0] summarize error:", detail)
    return NextResponse.json(
      { error: `要約の生成に失敗しました: ${detail}` },
      { status: 502 },
    )
  }
}
