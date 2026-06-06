import type { SymbolIndex } from "./symbol-index"
import type { TypeNode } from "./type-node"
import { renderTypeNode } from "./render-type-node"
import { getReferenceUrl } from "./reference-url"

export interface ResolvedTypeLink {
  readonly text: string
  readonly url?: string
}

export function resolveTypeLink(
  node: TypeNode,
  index: SymbolIndex,
): ResolvedTypeLink {

  const text = renderTypeNode(node)

  if (node.type.kind !== "named") {
    return { text }
  }

  const symbolId = `T:${node.type.name}`

  if (!index.byId.has(symbolId)) {
    return { text }
  }

  return {
    text,
    url: getReferenceUrl(symbolId),
  }
}