import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * 記事更新時にサーバー側の要約キャッシュを強制クリアするためのエンドポイント。
 *
 * `tags: ['summary']` が付いたすべてのキャッシュを無効化する。
 * 簡易的な保護として REVALIDATE_SECRET による認証を行う。
 *
 * 例:
 *   POST /api/summarize/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 })
    }
  }

  revalidateTag("summary")
  return NextResponse.json({ revalidated: true, tag: "summary" })
}
