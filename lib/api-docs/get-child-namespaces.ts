import type { SymbolIndex } from "./symbol-index"
import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"

export function getChildNamespaces(
  index: SymbolIndex,
  namespaceName: string,
): ApiYamlDocumentV1[] {

  return [...index.byId.values()]
    .filter(
      document =>
        document.type === "namespace"
        && document.namespace === namespaceName,
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}