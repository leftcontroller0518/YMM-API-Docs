import type { ApiYamlDocumentV1 } from "./yaml-v1-schema"
import type { SymbolIndex } from "./symbol-index"

export function getOverloadGroupKey(
  document: ApiYamlDocumentV1,
): string {

  if (document.type !== "method") {
    throw new Error("Document is not a method")
  }

  return `${document.declaringType.id}::${document.name}`
}

export interface OverloadIndex {
  readonly groups:
    ReadonlyMap<
      string,
      readonly ApiYamlDocumentV1[]
    >
}

export function buildOverloadIndex(
  index: SymbolIndex,
): OverloadIndex {

  const groups =
    new Map<
      string,
      ApiYamlDocumentV1[]
    >()

  for (const document of index.byId.values()) {

    if (document.type !== "method") {
      continue
    }

    const key =
      getOverloadGroupKey(document)

    const group =
      groups.get(key)

    if (group) {
      group.push(document)
    } else {
      groups.set(key, [document])
    }
  }

  return {
    groups,
  }
}

export function getOverloadGroup(
  overloadIndex: OverloadIndex,
  method: ApiYamlDocumentV1,
): readonly ApiYamlDocumentV1[] {

  if (method.type !== "method") {
    throw new Error("Document is not a method")
  }

  return (
    overloadIndex.groups.get(
      getOverloadGroupKey(method),
    )
    ?? []
  )
}
