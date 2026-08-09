import type { SymbolIndex } from "./symbol-index"
import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

export function getChildNamespaces(
  index: SymbolIndex,
  namespaceName: string,
): ApiYamlDocumentV1[] {

  return [...index.byId.values()]
    .filter(
      document =>
      {
      if (document.type !== "namespace") return false
      if (document.namespace !== undefined) {
        return document.namespace === namespaceName
      }

      const lastDot = document.name.lastIndexOf(".")
      if (lastDot === -1) return false
      return document.name.slice(0, lastDot) === namespaceName
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}