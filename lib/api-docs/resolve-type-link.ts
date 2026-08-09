import type { SymbolIndex } from "./symbol-index"
import type { TypeNode } from "./type-node"
import { renderTypeNode } from "./render-type-node"
import { getReferenceUrl } from "./reference-url"

export interface ResolvedTypeLink {
  readonly text: string
  readonly url?: string
}

export type ExternalTypeLinks = ReadonlyMap<string, string>

export function resolveTypeLink(
  node: TypeNode,
  index: SymbolIndex,
  externalLinks?: ExternalTypeLinks,
): ResolvedTypeLink {

  const text = renderTypeNode(node)

  if (node.type.kind !== "named") {
    return { text }
  }

  const symbolId = `T:${node.type.name}`

  if (index.byId.has(symbolId)) {
    return {
      text,
      url: getReferenceUrl(symbolId),
    }
  }

  if (externalLinks !== undefined) {
    const externalUrl = externalLinks.get(node.type.name)
    if (externalUrl !== undefined) {
      return {
        text,
        url: externalUrl,
      }
    }
  }

  return { text }
}