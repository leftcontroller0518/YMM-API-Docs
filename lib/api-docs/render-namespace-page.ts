import type { NamespacePageModel } from "./build-namespace-page-model"
import type { SymbolIndex } from "./symbol-index"
import type { ExternalTypeLinks } from "./resolve-type-link"
import { getReferenceUrl } from "./reference-url"

function typeLink(
  name: string,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const symbolId = `T:${name}`
  if (symbolIndex.byId.has(symbolId)) {
    return `[${name}](${getReferenceUrl(symbolId)})`
  }
  const url = externalLinks.get(name)
  if (url !== undefined) {
    return `[${name}](${url})`
  }
  return name
}

function namespaceLink(name: string, symbolIndex: SymbolIndex): string {
  const symbolId = `N:${name}`
  if (symbolIndex.byId.has(symbolId)) {
    return `[${name}](${getReferenceUrl(symbolId)})`
  }
  return name
}

function typeTable(
  header: string,
  docs: readonly { name: string; summary: string }[],
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  if (docs.length === 0) return ""

  let md = `## ${header}\n\n`
  md += `| 名前 | 説明 |\n`
  md += `| --- | --- |\n`
  for (const doc of docs) {
    md += `| ${typeLink(doc.name, symbolIndex, externalLinks)} | ${doc.summary} |\n`
  }
  md += `\n`
  return md
}

export function renderNamespacePage(
  model: NamespacePageModel,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const doc = model.namespace
  let md = ""

  md += `# ${doc.name}\n\n`
  md += `${doc.summary}\n\n`

  if (model.children.length > 0) {
    md += `## 名前空間\n\n`
    md += `| 名前 | 説明 |\n`
    md += `| --- | --- |\n`
    for (const child of model.children) {
      md += `| ${namespaceLink(child.name, symbolIndex)} | ${child.summary} |\n`
    }
    md += `\n`
  }

  md += typeTable("クラス", model.classes, symbolIndex, externalLinks)
  md += typeTable("インターフェース", model.interfaces, symbolIndex, externalLinks)
  md += typeTable("構造体", model.structs, symbolIndex, externalLinks)
  md += typeTable("列挙型", model.enums, symbolIndex, externalLinks)
  md += typeTable("デリゲート", model.delegates, symbolIndex, externalLinks)

  return md.trim()
}