import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { generateText } from "ai"
import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getDocMarkdownBySlug } from "@/lib/doc-markdown"

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
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(8000),
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

class ArticleNotFoundError extends Error {}
class MissingApiKeyError extends Error {}

const getCachedSummary = unstable_cache(
  async (articleId: string): Promise<string> => {
    const markdown = getDocMarkdownBySlug(articleId === "home" ? "" : articleId, articleId === "home")

    if (!markdown) {
      throw new ArticleNotFoundError("指定された記事が見つかりません")
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new MissingApiKeyError("サーバー設定エラー: GOOGLE_GENERATIVE_AI_API_KEY が未設定です")
    }

    return generateSummary(markdown)
  },
  ["article-summary"],
  {
    tags: ["summary"],
    revalidate: false,
  },
)

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

  try {
    const summary = await getCachedSummary(articleId)
    return NextResponse.json({ summary, cached: true })
  } catch (error) {
    if (error instanceof ArticleNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof MissingApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const detail = error instanceof Error ? error.message : String(error)
    console.log("[v0] summarize error:", detail)
    return NextResponse.json(
      { error: `要約の生成に失敗しました: ${detail}` },
      { status: 502 },
    )
  }
}
