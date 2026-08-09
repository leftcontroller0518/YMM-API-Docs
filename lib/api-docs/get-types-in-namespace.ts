import type { SymbolIndex } from "./symbol-index"
import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

const typeKinds = new Set([
  "class",
  "interface",
  "struct",
  "enum",
  "delegate",
])

export function getTypesInNamespace(
  index: SymbolIndex,
  namespaceName: string,
): ApiYamlDocumentV1[] {

  return [...index.byId.values()]
    .filter(document => {

      if (!("namespace" in document)) {
        return false
      }

      return (
        document.namespace === namespaceName
        && typeKinds.has(document.type)
      )
    })
}