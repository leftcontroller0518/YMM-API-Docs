import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { ApiYamlDocumentV1Schema } from "./yaml-v1-schema"
import { getReferenceUrl } from "./reference-url"

const REFERENCE_DIRECTORY = path.join(process.cwd(), "content", "reference")

export interface ApiDocRedirect {
  readonly source: string
  readonly destination: string
  readonly permanent: boolean
}

function filePathToSlug(filePath: string): string {
  const relative = path.relative(
    path.join(process.cwd(), "content"),
    filePath,
  )
  const withoutExt = relative.replace(/\.(yaml|yml)$/, "")
  const normalized = withoutExt.split(path.sep).join("/")
  const withoutIndex = normalized.endsWith("/index")
    ? normalized.slice(0, -"/index".length)
    : normalized
  return "/" + withoutIndex.toLowerCase().replace(/\s+/g, "-")
}

function walkYaml(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkYaml(full))
    } else if (entry.endsWith(".yaml") || entry.endsWith(".yml")) {
      results.push(full)
    }
  }
  return results
}

export function buildApiDocRedirects(): ApiDocRedirect[] {
  const redirects: ApiDocRedirect[] = []

  for (const filePath of walkYaml(REFERENCE_DIRECTORY)) {
    const raw = fs.readFileSync(filePath, "utf-8")
    let parsed: unknown
    try {
      parsed = yaml.load(raw)
    } catch {
      continue
    }
    const result = ApiYamlDocumentV1Schema.safeParse(parsed)
    if (!result.success) continue

    const doc = result.data
    const source = getReferenceUrl(doc.id)
    const destination = filePathToSlug(filePath)

    // source と destination が異なる場合のみリダイレクトを追加
    if (source.toLowerCase() !== destination.toLowerCase()) {
      redirects.push({
        source,
        destination,
        permanent: false,
      })
    }
  }

  return redirects
}