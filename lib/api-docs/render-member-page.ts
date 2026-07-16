import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import type { SymbolIndex } from "./symbol-index"
import type { ExternalTypeLinks } from "./resolve-type-link"
import type { TypeNode } from "./type-node"
import type { OverloadIndex } from "./overload-group"
import { resolveTypeLink } from "./resolve-type-link"
import { getReferenceUrl } from "./reference-url"
import { getOverloadGroup } from "./overload-group"

function resolvedLink(
  node: TypeNode,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const resolved = resolveTypeLink(node, symbolIndex, externalLinks)
  return resolved.url !== undefined
    ? `[${resolved.text}](${resolved.url})`
    : resolved.text
}

function declaringTypeLink(doc: ApiYamlDocumentV1): string {
  if (
    doc.type !== "method"
    && doc.type !== "property"
    && doc.type !== "field"
    && doc.type !== "event"
  ) {
    return ""
  }
  const id = doc.declaringType.id
  return `[${id.slice(2)}](${getReferenceUrl(id)})`
}

export function renderMethodPage(
  doc: ApiYamlDocumentV1 & { type: "method" },
  symbolIndex: SymbolIndex,
  overloadIndex: OverloadIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const group = getOverloadGroup(overloadIndex, doc)
  let md = ""

  md += `# ${doc.name}\n\n`
  md += `## 定義\n\n`
  md += `宣言型: ${declaringTypeLink(doc)}\n\n`
  if (doc.assembly !== undefined) {
    md += `アセンブリ: ${doc.assembly}\n\n`
  }

  if (group.length > 1) {
    // オーバーロード一覧
    md += `## オーバーロード\n\n`
    md += `| 名前 | 説明 |\n`
    md += `| --- | --- |\n`
    for (const m of group) {
      md += `| [${m.name}](${getReferenceUrl(m.id)}) | ${m.summary} |\n`
    }
    md += `\n`
  }

  // 対象メソッドの詳細（このYAMLのもの）
  md += `## 概要\n\n`
  md += `${doc.summary}\n\n`

  if (doc.code !== undefined) {
    md += "```csharp\n" + doc.code + "\n```\n\n"
  }

  if (doc.parameters !== undefined && doc.parameters.length > 0) {
    md += `#### パラメーター\n\n`
    for (const p of doc.parameters) {
      const mod = p.modifier !== undefined ? `${p.modifier} ` : ""
      md += `\`${p.name}\` ${mod}${resolvedLink(p.type, symbolIndex, externalLinks)}\n\n`
    }
  }

  md += `#### 戻り値\n\n`
  md += `${resolvedLink(doc.returns, symbolIndex, externalLinks)}\n\n`

  if (doc.remarks !== undefined) {
    md += `## 注釈\n\n${doc.remarks}\n\n`
  }

  if (doc.examples !== undefined) {
    md += `## 例\n\n${doc.examples}\n\n`
  }

  return md.trim()
}

export function renderPropertyPage(
  doc: ApiYamlDocumentV1 & { type: "property" },
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  let md = ""

  md += `# ${doc.name}\n\n`
  md += `## 定義\n\n`
  md += `宣言型: ${declaringTypeLink(doc)}\n\n`
  if (doc.assembly !== undefined) {
    md += `アセンブリ: ${doc.assembly}\n\n`
  }
  md += `${doc.summary}\n\n`

  if (doc.code !== undefined) {
    md += "```csharp\n" + doc.code + "\n```\n\n"
  }

  if (doc.propertyType !== undefined) {
    md += `#### プロパティー値\n\n`
    md += `${resolvedLink(doc.propertyType, symbolIndex, externalLinks)}\n\n`
  }

  if (doc.remarks !== undefined) {
    md += `## 注釈\n\n${doc.remarks}\n\n`
  }

  if (doc.examples !== undefined) {
    md += `## 例\n\n${doc.examples}\n\n`
  }

  return md.trim()
}

export function renderFieldPage(
  doc: ApiYamlDocumentV1 & { type: "field" },
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  let md = ""

  md += `# ${doc.name}\n\n`
  md += `## 定義\n\n`
  md += `宣言型: ${declaringTypeLink(doc)}\n\n`
  if (doc.assembly !== undefined) {
    md += `アセンブリ: ${doc.assembly}\n\n`
  }
  md += `${doc.summary}\n\n`

  if (doc.code !== undefined) {
    md += "```csharp\n" + doc.code + "\n```\n\n"
  }

  if (doc.fieldType !== undefined) {
    md += `#### 型\n\n`
    md += `${resolvedLink(doc.fieldType, symbolIndex, externalLinks)}\n\n`
  }

  if (doc.remarks !== undefined) {
    md += `## 注釈\n\n${doc.remarks}\n\n`
  }

  if (doc.examples !== undefined) {
    md += `## 例\n\n${doc.examples}\n\n`
  }

  return md.trim()
}

export function renderEventPage(
  doc: ApiYamlDocumentV1 & { type: "event" },
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  let md = ""

  md += `# ${doc.name}\n\n`
  md += `## 定義\n\n`
  md += `宣言型: ${declaringTypeLink(doc)}\n\n`
  if (doc.assembly !== undefined) {
    md += `アセンブリ: ${doc.assembly}\n\n`
  }
  md += `${doc.summary}\n\n`

  if (doc.code !== undefined) {
    md += "```csharp\n" + doc.code + "\n```\n\n"
  }

  if (doc.eventType !== undefined) {
    md += `#### イベントの型\n\n`
    md += `${resolvedLink(doc.eventType, symbolIndex, externalLinks)}\n\n`
  }

  if (doc.remarks !== undefined) {
    md += `## 注釈\n\n${doc.remarks}\n\n`
  }

  if (doc.examples !== undefined) {
    md += `## 例\n\n${doc.examples}\n\n`
  }

  return md.trim()
}