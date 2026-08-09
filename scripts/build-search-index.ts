import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { readDocFileAsMarkdown, resolveDocPath } from "@/lib/doc-markdown"
import { getAllDocPaths } from "@/lib/docs"

export interface SearchIndexEntry {
  id: number
  slug: string
  title: string
  body: string
  section: string
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function buildSearchIndex() {
  const slugs = getAllDocPaths()
  const entries: SearchIndexEntry[] = []
  let id = 0

  for (const slug of slugs) {
    const fullPath = resolveDocPath(slug, slug === "")
    if (!fullPath) continue

    const raw = readDocFileAsMarkdown(fullPath)
    if (!raw) continue

    const { data, content } = matter(raw)

    let title = data.title as string | undefined
    if (!title) {
      const h1 = content.match(/^# (.+)$/m)
      title = h1 ? h1[1] : path.basename(slug)
    }

    const body = markdownToPlainText(content)
    const section = slug.split("/")[0] ?? ""

    entries.push({ id: id++, slug, title, body, section })
  }

  const outputPath = path.join(process.cwd(), "public", "search-index.json")
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(entries), "utf-8")

  console.log(`Search index built: ${entries.length} entries → ${outputPath}`)
}

buildSearchIndex().catch((e) => {
  console.error("Failed to build search index:", e)
  process.exit(1)
})