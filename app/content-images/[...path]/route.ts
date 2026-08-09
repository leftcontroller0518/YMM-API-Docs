import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

const DOCS_DIRECTORY = path.join(process.cwd(), "content")

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params

  const joined = pathSegments.join("/")
  const resolved = path.resolve(DOCS_DIRECTORY, joined)
  if (!resolved.startsWith(DOCS_DIRECTORY)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const ext = path.extname(resolved).toLowerCase()
  const mimeType = MIME_TYPES[ext]
  if (mimeType === undefined) {
    return new NextResponse("Unsupported file type", { status: 415 })
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const file = fs.readFileSync(resolved)

  return new NextResponse(file, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}