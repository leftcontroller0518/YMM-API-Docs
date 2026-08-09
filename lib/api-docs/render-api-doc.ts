import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { ApiYamlDocumentV1Schema } from "./yaml-v1-schema"
import { buildSymbolIndex } from "./symbol-index"
import { buildInheritanceIndex } from "./inheritance-index"
import { buildOverloadIndex } from "./overload-group"
import { buildNamespacePageModel } from "./build-namespace-page-model"
import { buildTypePageModel } from "./type-page-model"
import { loadExternalTypeLinks } from "./external-type-links"
import { renderNamespacePage } from "./render-namespace-page"
import { renderTypePage } from "./render-type-page"
import {
  renderMethodPage,
  renderPropertyPage,
  renderFieldPage,
  renderEventPage,
} from "./render-member-page"

const REFERENCE_DIRECTORY = path.join(process.cwd(), "content", "reference")

function loadAllApiDocuments() {
  const results: ReturnType<typeof ApiYamlDocumentV1Schema.parse>[] = []

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".yaml") || entry.endsWith(".yml")) {
        const raw = fs.readFileSync(full, "utf-8")
        const parsed = yaml.load(raw)
        const result = ApiYamlDocumentV1Schema.safeParse(parsed)
        if (result.success) {
          results.push(result.data)
        }
      }
    }
  }

  walk(REFERENCE_DIRECTORY)
  return results
}

// キャッシュ（Next.js のビルド時に複数回呼ばれることへの対策）
let cachedIndexes: ReturnType<typeof buildIndexes> | undefined

function buildIndexes() {
  const documents = loadAllApiDocuments()
  const symbolIndex = buildSymbolIndex(documents)
  const inheritanceIndex = buildInheritanceIndex(symbolIndex)
  const overloadIndex = buildOverloadIndex(symbolIndex)
  const externalLinks = loadExternalTypeLinks()
  return { symbolIndex, inheritanceIndex, overloadIndex, externalLinks }
}

function getIndexes() {
  if (cachedIndexes === undefined) {
    cachedIndexes = buildIndexes()
  }
  return cachedIndexes
}

export function isApiDocument(yamlContent: string): boolean {
  try {
    const parsed = yaml.load(yamlContent)
    return ApiYamlDocumentV1Schema.safeParse(parsed).success
  } catch {
    return false
  }
}

export function renderApiDocToMarkdown(yamlContent: string): string | undefined {
  try {
    const parsed = yaml.load(yamlContent)
    const result = ApiYamlDocumentV1Schema.safeParse(parsed)
    if (!result.success) return undefined

    const doc = result.data
    const { symbolIndex, inheritanceIndex, overloadIndex, externalLinks } =
      getIndexes()

    if (doc.type === "namespace") {
      const model = buildNamespacePageModel(symbolIndex, doc.name)
      return renderNamespacePage(model, symbolIndex, externalLinks)
    }

    if (
      doc.type === "class"
      || doc.type === "interface"
      || doc.type === "struct"
      || doc.type === "enum"
      || doc.type === "delegate"
    ) {
      const model = buildTypePageModel(
        symbolIndex,
        inheritanceIndex,
        overloadIndex,
        doc.id,
      )
      return renderTypePage(model, symbolIndex, externalLinks)
    }

    if (doc.type === "method") {
      return renderMethodPage(doc, symbolIndex, overloadIndex, externalLinks)
    }

    if (doc.type === "property") {
      return renderPropertyPage(doc, symbolIndex, externalLinks)
    }

    if (doc.type === "field") {
      return renderFieldPage(doc, symbolIndex, externalLinks)
    }

    if (doc.type === "event") {
      return renderEventPage(doc, symbolIndex, externalLinks)
    }

    return undefined
  } catch (error) {
    console.error("renderApiDocToMarkdown error:", error)
    return undefined
  }
}