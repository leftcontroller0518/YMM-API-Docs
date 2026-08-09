import type { TypePageModel, OverloadGroup } from "./type-page-model"
import type { SymbolIndex } from "./symbol-index"
import type { ExternalTypeLinks } from "./resolve-type-link"
import type { TypeNode } from "./type-node"
import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import { resolveTypeLink } from "./resolve-type-link"
import { getReferenceUrl } from "./reference-url"

function resolvedLink(
  node: TypeNode,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const resolved = resolveTypeLink(node, symbolIndex, externalLinks)
  if (resolved.url !== undefined) {
    return `[${resolved.text}](${resolved.url})`
  }
  return resolved.text
}

function memberLink(doc: ApiYamlDocumentV1): string {
  return `[${doc.name}](${getReferenceUrl(doc.id)})`
}

function renderParameters(
  params: readonly { name: string; modifier?: string; type: TypeNode }[],
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  if (params.length === 0) return ""
  let md = `#### パラメーター\n\n`
  for (const p of params) {
    const mod = p.modifier !== undefined ? `${p.modifier} ` : ""
    md += `\`${p.name}\` ${mod}${resolvedLink(p.type, symbolIndex, externalLinks)}\n\n`
  }
  return md
}

function renderOverloadGroup(
  group: OverloadGroup,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
  showH2: boolean,
): string {
  let md = ""

  if (group.methods.length === 1) {
    const method = group.methods[0]
    if (showH2) {
      md += `### ${memberLink(method)}\n\n`
    }
    md += `${method.summary}\n\n`
    if (method.type === "method" && method.code !== undefined) {
      md += "```csharp\n" + method.code + "\n```\n\n"
    }
    if (method.type === "method" && method.parameters !== undefined) {
      md += renderParameters(method.parameters, symbolIndex, externalLinks)
    }
    if (method.type === "method") {
      md += `#### 戻り値\n\n`
      md += `${resolvedLink(method.returns, symbolIndex, externalLinks)}\n\n`
    }
    if (method.type === "method" && method.remarks !== undefined) {
      md += `#### 注釈\n\n${method.remarks}\n\n`
    }
    if (method.type === "method" && method.examples !== undefined) {
      md += `#### 例\n\n${method.examples}\n\n`
    }
    return md
  }

  // オーバーロード複数
  if (showH2) {
    md += `## ${group.name}\n\n`
  }
  md += `| 名前 | 説明 |\n`
  md += `| --- | --- |\n`
  for (const m of group.methods) {
    md += `| ${memberLink(m)} | ${m.summary} |\n`
  }
  md += `\n`

  for (const method of group.methods) {
    md += `### ${memberLink(method)}\n\n`
    md += `${method.summary}\n\n`
    if (method.type === "method" && method.code !== undefined) {
      md += "```csharp\n" + method.code + "\n```\n\n"
    }
    if (method.type === "method" && method.parameters !== undefined) {
      md += renderParameters(method.parameters, symbolIndex, externalLinks)
    }
    if (method.type === "method") {
      md += `#### 戻り値\n\n`
      md += `${resolvedLink(method.returns, symbolIndex, externalLinks)}\n\n`
    }
    if (method.type === "method" && method.remarks !== undefined) {
      md += `#### 注釈\n\n${method.remarks}\n\n`
    }
    if (method.type === "method" && method.examples !== undefined) {
      md += `#### 例\n\n${method.examples}\n\n`
    }
  }

  return md
}

export function renderTypePage(
  model: TypePageModel,
  symbolIndex: SymbolIndex,
  externalLinks: ExternalTypeLinks,
): string {
  const doc = model.document
  let md = ""

  // タイトル
  md += `# ${doc.name}\n\n`

  // 定義
  md += `## 定義\n\n`
  if (
    doc.type === "class"
    || doc.type === "interface"
    || doc.type === "struct"
    || doc.type === "enum"
    || doc.type === "delegate"
  ) {
    md += `名前空間: ${doc.namespace}\n\n`
    if (doc.assembly !== undefined) {
      md += `アセンブリ: ${doc.assembly}\n\n`
    }
  }

  md += `${doc.summary}\n\n`

  // コード
  if (
    (doc.type === "class"
      || doc.type === "interface"
      || doc.type === "struct"
      || doc.type === "enum"
      || doc.type === "delegate")
    && doc.code !== undefined
  ) {
    md += "```csharp\n" + doc.code + "\n```\n\n"
  }

  // 継承チェーン
  if (model.inheritanceChain.length > 0) {
    const chain = model.inheritanceChain
      .map(node => resolvedLink(node, symbolIndex, externalLinks))
      .join(" → ")
    md += `継承 ${chain} → ${doc.name}\n\n`
  }

  // 実装インターフェース
  if (model.implements.length > 0) {
    const impls = model.implements
      .map(node => resolvedLink(node, symbolIndex, externalLinks))
      .join(", ")
    md += `実装 ${impls}\n\n`
  }

  // 派生型
  if (model.derivedTypes.length > 0) {
    const derived = model.derivedTypes
      .map(d => `[${d.name}](${getReferenceUrl(d.id)})`)
      .join(", ")
    md += `派生 ${derived}\n\n`
  }

  // 実装型（インターフェースの場合）
  if (model.implementedBy.length > 0) {
    const impBy = model.implementedBy
      .map(d => `[${d.name}](${getReferenceUrl(d.id)})`)
      .join(", ")
    md += `実装型 ${impBy}\n\n`
  }

  // remarks
  if (
    (doc.type === "class"
      || doc.type === "interface"
      || doc.type === "struct"
      || doc.type === "enum"
      || doc.type === "delegate")
    && doc.remarks !== undefined
  ) {
    md += `## 注釈\n\n${doc.remarks}\n\n`
  }

  // メソッド
  if (model.methods.length > 0) {
    md += `## メソッド\n\n`
    if (model.methods.length > 1 || model.methods[0].methods.length > 1) {
      md += `| 名前 | 説明 |\n`
      md += `| --- | --- |\n`
      for (const group of model.methods) {
        for (const m of group.methods) {
          md += `| ${memberLink(m)} | ${m.summary} |\n`
        }
      }
      md += `\n`
    }
    for (const group of model.methods) {
      md += renderOverloadGroup(group, symbolIndex, externalLinks, true)
    }
  }

  // プロパティ
  if (model.properties.length > 0) {
    md += `## プロパティー\n\n`
    md += `| 名前 | 型 | 説明 |\n`
    md += `| --- | --- | --- |\n`
    for (const p of model.properties) {
      const typeStr =
        p.type === "property" && p.propertyType !== undefined
          ? resolvedLink(p.propertyType, symbolIndex, externalLinks)
          : ""
      md += `| ${memberLink(p)} | ${typeStr} | ${p.summary} |\n`
    }
    md += `\n`
    for (const p of model.properties) {
      md += `### ${memberLink(p)}\n\n`
      md += `${p.summary}\n\n`
      if (p.type === "property" && p.code !== undefined) {
        md += "```csharp\n" + p.code + "\n```\n\n"
      }
      if (p.type === "property" && p.propertyType !== undefined) {
        md += `#### プロパティー値\n\n`
        md += `${resolvedLink(p.propertyType, symbolIndex, externalLinks)}\n\n`
      }
      if (p.type === "property" && p.remarks !== undefined) {
        md += `#### 注釈\n\n${p.remarks}\n\n`
      }
    }
  }

  // フィールド
  if (model.fields.length > 0) {
    md += `## フィールド\n\n`
    md += `| 名前 | 型 | 説明 |\n`
    md += `| --- | --- | --- |\n`
    for (const f of model.fields) {
      const typeStr =
        f.type === "field" && f.fieldType !== undefined
          ? resolvedLink(f.fieldType, symbolIndex, externalLinks)
          : ""
      md += `| ${memberLink(f)} | ${typeStr} | ${f.summary} |\n`
    }
    md += `\n`
    for (const f of model.fields) {
      md += `## ${memberLink(f)}\n\n`
      md += `${f.summary}\n\n`
      if (f.type === "field" && f.code !== undefined) {
        md += "```csharp\n" + f.code + "\n```\n\n"
      }
      if (f.type === "field" && f.fieldType !== undefined) {
        md += `#### 型\n\n`
        md += `${resolvedLink(f.fieldType, symbolIndex, externalLinks)}\n\n`
      }
      if (f.type === "field" && f.remarks !== undefined) {
        md += `#### 注釈\n\n${f.remarks}\n\n`
      }
    }
  }

  // イベント
  if (model.events.length > 0) {
    md += `## イベント\n\n`
    md += `| 名前 | 型 | 説明 |\n`
    md += `| --- | --- | --- |\n`
    for (const e of model.events) {
      const typeStr =
        e.type === "event" && e.eventType !== undefined
          ? resolvedLink(e.eventType, symbolIndex, externalLinks)
          : ""
      md += `| ${memberLink(e)} | ${typeStr} | ${e.summary} |\n`
    }
    md += `\n`
    for (const e of model.events) {
      md += `## ${memberLink(e)}\n\n`
      md += `${e.summary}\n\n`
      if (e.type === "event" && e.code !== undefined) {
        md += "```csharp\n" + e.code + "\n```\n\n"
      }
      if (e.type === "event" && e.eventType !== undefined) {
        md += `#### イベントの型\n\n`
        md += `${resolvedLink(e.eventType, symbolIndex, externalLinks)}\n\n`
      }
      if (e.type === "event" && e.remarks !== undefined) {
        md += `#### 注釈\n\n${e.remarks}\n\n`
      }
    }
  }

  return md.trim()
}